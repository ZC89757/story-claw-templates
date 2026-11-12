"""Prepare image-derived static maps for portrait MG. Requires numpy, opencv-python, Pillow.
python prepare.py flash INPUT OUTPUT_DIRECTORY
python prepare.py intro INPUT OUTPUT.png
Only source images/static textures are processed. No rendered animation is used.
"""
import argparse,json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
WIDTH, HEIGHT = 360, 640
def gaussian(pixels, sx, sy=None):
    return cv2.GaussianBlur(pixels, (0, 0), sx, sigmaY=sy or sx)


def make_surrounds():
    y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
    rng = np.random.default_rng(11001)
    phase_x = (0.85 * x + 0.53 * y) / 4.2
    phase_y = (-0.53 * x + 0.85 * y) / 4.2
    phase_x += 0.12 * np.sin(y * 0.055 + x * 0.019)
    phase_y += 0.13 * np.sin(x * 0.039 - y * 0.022)
    dots = np.exp(-12 * ((phase_x - np.rint(phase_x)) ** 2
                        + (phase_y - np.rint(phase_y)) ** 2))
    fine = rng.normal(0, 1.1, (HEIGHT, WIDTH))
    left = np.exp(-((x - 18) / 104) ** 2 - ((y - 537) / 135) ** 2)
    right = np.exp(-((x - 309) / 100) ** 2 - ((y - 615) / 90) ** 2)
    dark = np.broadcast_to([4, 15, 17], (HEIGHT, WIDTH, 3)).copy().astype(np.float32)
    dark += left[..., None] * np.array([8, 3, 3])
    dark += right[..., None] * np.array([7, 2, 3])
    dark += (dots * (48 * left + 44 * right) + fine)[..., None]
    light = dark.copy()
    top_haze = (np.exp(-((x - 56) / 130) ** 2 - (y / 89) ** 2)
                + 0.75 * np.exp(-((x - 340) / 95) ** 2 - (y / 82) ** 2))
    mottle = np.clip(0.55 + 0.38 * np.cos((x + 24) / 46 + y / 15)
                     + 0.29 * np.sin(x / 33 - y / 21), 0.12, 1.1)
    light += (top_haze * (3 + 43 * dots * mottle))[..., None]
    light += left[..., None] * np.array([50, 57, 62])
    light += right[..., None] * np.array([69, 54, 46])
    light += (dots * (21 * left + 11 * right))[..., None]
    late = dark.copy()
    late += (left * (8 + 7 * dots) - right * (5 + 11 * dots))[..., None]
    return dark, light, late


class Portrait:
    def __init__(self, root, cfg):
        file = root / cfg["file"]
        with Image.open(file) as image:
            if "A" not in image.getbands() and "transparency" not in image.info:
                raise ValueError(f"Portrait requires an alpha channel: {file}")
            rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
        alpha = rgba[..., 3] / 255
        y, x = np.nonzero(alpha > 0.08)
        if not len(x) or alpha.min() >= 0.98:
            raise ValueError(f"Portrait must contain both a visible cutout and transparency: {file}")
        src = rgba[y.min():y.max() + 1, x.min():x.max() + 1]
        px, py, pw, ph = map(float, cfg["rect"])
        if pw <= 0 or ph <= 0 or px >= WIDTH or py >= HEIGHT or px + pw <= 0 or py + ph <= 0:
            raise ValueError("Portrait rectangle must overlap the output and have positive dimensions")
        a = src[..., 3] / 255
        premult = np.dstack((src[..., :3] * a[..., None], a))
        m = np.array([[pw / src.shape[1], 0, px],
                      [0, ph / src.shape[0], py]], dtype=np.float32)
        canvas = cv2.warpAffine(premult, m, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR)
        # Keep the dark edge uneven at native resolution, with no temporal crawl.
        y, x = np.mgrid[:HEIGHT, :WIDTH].astype(np.float32)
        random = np.random.default_rng(11001)
        grain = gaussian(random.standard_normal((HEIGHT, WIDTH, 2)).astype(np.float32), 0.65)
        rough_x = x + 1.18 * grain[..., 0]
        rough_y = y + 1.05 * grain[..., 1]
        textured = cv2.remap(canvas, rough_x, rough_y, cv2.INTER_LINEAR)
        kernel = np.ones((3, 3), dtype=np.uint8)
        contour = cv2.dilate(canvas[..., 3], kernel) - cv2.erode(canvas[..., 3], kernel)
        canvas += (textured - canvas) * contour[..., None]
        self.a = canvas[..., 3]
        self.rgb = canvas[..., :3] / np.maximum(self.a[..., None], 0.001)
        self.rgb *= np.asarray(cfg.get("grade", [1, 1, 1]), dtype=np.float32)
        self.rgb = np.clip(self.rgb, 0, 255)
        self.rim = np.maximum(0, gaussian(cv2.dilate(self.a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))),
                                          0.78) - self.a)
        self.rim *= np.clip(0.88 + 0.32 * grain[..., 0] + 0.16 * grain[..., 1], 0.58, 1.12)
        solid = cv2.erode((self.a > 0.94).astype(np.float32), np.ones((3, 3), np.uint8))
        inner = gaussian(solid, 1.9)
        nearest = gaussian(self.rgb * solid[..., None], 1.9) / np.maximum(inner[..., None], 1e-3)
        edge = np.clip(self.a - cv2.erode(self.a, np.ones((5, 5), np.uint8)), 0, 1)
        recolor = (0.50 * edge * np.clip(inner * 3, 0, 1))[..., None]
        self.edge_rgb = (self.rgb * (1 - recolor) + nearest * recolor) * (1 - 0.10 * edge[..., None])
        self.edge_recovery = (cv2.dilate(self.a, np.ones((7, 7), np.uint8))
                              - cv2.erode(self.a, np.ones((7, 7), np.uint8)))[..., None]
        luma = self.rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        hot = np.clip((luma - 37) / 115, 0, 1) ** 1.30
        shoulder = np.clip((luma - 151) / 60, 0, 1)
        self.highlight_hold = (shoulder * shoulder * (3 - 2 * shoulder))[..., None]
        cloth = np.clip((luma - 13) / 62, 0, 1) * (1 - hot)
        self.lift = (166 * hot[..., None]
                     + np.array([16, 19, 33], np.float32) * (1 - hot[..., None])
                     + cloth[..., None] * np.array([21, 26, 53], np.float32))
        emission = (hot ** 1.5) * self.a
        self.glow = gaussian(emission, 5.0, 12.8)
        self.bloom = gaussian(emission, 2.3, 4.4)
        # Convolve light along the shutter direction and retain the narrow trails.
        # Diffuse light is handled separately so the smear keeps visible direction.
        weights = np.exp(np.linspace(-2.5, 0, 60, dtype=np.float32))
        weights /= weights.sum()
        vertical = cv2.sepFilter2D(emission, -1, np.ones(1, np.float32), weights,
                                   anchor=(0, 59), borderType=cv2.BORDER_CONSTANT)
        vertical = gaussian(vertical, 1.85, 3.4)
        self.streak = np.maximum(0, vertical - 0.80 * gaussian(vertical, 6.4, 1.0))
        # For a luminous garment panel, propagate existing fabric highlights toward the hem.
        fabric = np.clip((luma - 53) / 51, 0, 1) * (1 - hot) * self.a
        center = np.exp(-((x - (px + 0.51 * pw)) / (0.24 * pw)) ** 4)
        fabric *= 0.16 + 0.84 * center
        fabric *= np.clip((y - py - 0.43 * ph) / (0.09 * ph), 0, 1)
        cloth_kernel = np.ones((115, 1), dtype=np.uint8)
        cloth = cv2.dilate(fabric, cloth_kernel, anchor=(0, 114))
        narrow = np.maximum(0, cloth - 0.88 * gaussian(cloth, 9.5, 2.0) - 0.025)
        self.cloth_streak = gaussian(narrow, 1.65, 8.0) * self.a
        bright_nearby = cv2.dilate(emission, np.ones((7, 3), np.uint8))
        self.diffusion = gaussian(bright_nearby, 1.25, 4.6)
        self.ghost = gaussian(self.a, 1.7, 7.5)
        self.soft_a = gaussian(self.a, 1.25, 9.2)[..., None]
        # Draw a short downward wake from highlights, including the lighter fabric.
        # The cutout and its pixel values determine where the wake is visible.
        decay = np.exp(np.linspace(-2.25, 0, 151, dtype=np.float32))
        decay /= decay.sum()
        wake = cv2.sepFilter2D(hot * self.a, -1, np.array([0.22, 0.56, 0.22], np.float32),
                               decay, anchor=(1, 150), borderType=cv2.BORDER_CONSTANT)
        carrier = np.clip((luma - 26) / 53, 0, 1)
        self.wake = wake * (0.17 + 0.83 * carrier) * self.a
        edge_blur = gaussian(self.a, 0.85, 1.75)
        offset = np.array([[1, 0, -0.8], [0, 1, 7.5]], dtype=np.float32)
        echo = cv2.warpAffine(edge_blur, offset, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR)
        self.edge_echo = np.maximum(0, echo - self.a)


def prepare_flash(source, output):
    output.mkdir(parents=True, exist_ok=True)
    p=Portrait(source.parent, {'file':source.name,'rect':[0,138,278,502],'grade':[1.055,1.018,1.18]})
    fields=['a','rgb','rim','edge_rgb','edge_recovery','highlight_hold','lift','glow','bloom','streak','cloth_streak','diffusion','ghost','soft_a','wake','edge_echo']
    metadata={'width':WIDTH,'height':HEIGHT,'format':'uint16-le','fields':{},'binary':'flash.bin'}; chunks=[]; offset=0
    for name in fields:
        data=np.asarray(getattr(p,name),dtype=np.float32); low=float(data.min()); high=float(data.max()); span=high-low or 1
        packed=np.uint16(np.round(np.clip((data-low)/span,0,1)*65535))
        metadata['fields'][name]={'offset':offset,'length':int(data.size),'channels':int(data.size//(WIDTH*HEIGHT)),'min':low,'range':span}
        chunks.append(packed.astype('<u2').tobytes()); offset+=int(data.size)
    (output/'flash.bin').write_bytes(b''.join(chunks))
    (output/'flash.json').write_text(json.dumps(metadata),encoding='utf8')
    for name,a in zip(['surround-dark','surround-light','surround-late'],make_surrounds()):Image.fromarray(np.uint8(np.clip(a,0,255))).save(output/(name+'.png'))

def read_cutout(source):
    image=Image.open(source)
    if 'A' not in image.getbands() and 'transparency' not in image.info:raise ValueError('Input must have an alpha channel')
    image=image.convert('RGBA');alpha=np.asarray(image.getchannel('A'))
    if alpha.max()==0 or alpha.min()>=250:raise ValueError('Input needs both a visible subject and transparency')
    return image

def prepare_intro(source, output):
    im=read_cutout(source); box=im.getbbox()
    if box:im=im.crop(box)
    im=im.resize((247,485),Image.Resampling.LANCZOS)
    yy,xx=np.mgrid[0:485,0:272]; factor=np.clip((yy-485*.31)/(485*.37),0,1);factor=factor*factor*(3-2*factor)
    data=np.asarray(im,dtype=np.float32);a=data[...,3:]/255;data=np.concatenate((data[...,:3]*a,data[...,3:]),axis=2)
    mapped=cv2.remap(data,np.float32(xx-25*factor),np.float32(yy),cv2.INTER_LINEAR)
    alpha=mapped[...,3:];rgb=np.divide(255*mapped[...,:3],alpha,out=np.zeros_like(mapped[...,:3]),where=alpha>0)
    output.parent.mkdir(parents=True,exist_ok=True)
    Image.fromarray(np.uint8(np.clip(np.concatenate((rgb,alpha),axis=2),0,255))).save(output)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('mode',choices=['flash','intro','crop']);p.add_argument('source',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
    if a.mode=='flash':prepare_flash(a.source.resolve(),a.output.resolve())
    elif a.mode=='intro':prepare_intro(a.source.resolve(),a.output.resolve())
    else:
        im=read_cutout(a.source);box=im.getbbox()
        if not box:raise ValueError('Input has no visible alpha subject')
        a.output.parent.mkdir(parents=True,exist_ok=True);im.crop(box).save(a.output)
