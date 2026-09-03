"""Lê um PNG RGB sem depender de biblioteca externa.

Existe porque a conferência de contraste do menu precisou olhar o
pixel de verdade — o que a captura mostra na tela engana, e a conta
teórica não vê o que o navegador realmente pintou.
"""
import struct, zlib

def carrega(caminho):
    d = open(caminho, 'rb').read()
    w, h = struct.unpack('>II', d[16:24])
    i, dados = 8, b''
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]
        if d[i+4:i+8] == b'IDAT':
            dados += d[i+8:i+8+ln]
        i += 12 + ln
    raw = zlib.decompress(dados)
    bpp, linha = 3, w * 3
    out = bytearray(h * linha)
    ant = bytearray(linha)
    pos = 0
    for y in range(h):
        f = raw[pos]; pos += 1
        at = bytearray(raw[pos:pos + linha]); pos += linha
        if f == 1:
            for x in range(bpp, linha): at[x] = (at[x] + at[x - bpp]) & 255
        elif f == 2:
            for x in range(linha): at[x] = (at[x] + ant[x]) & 255
        elif f == 3:
            for x in range(linha):
                a = at[x - bpp] if x >= bpp else 0
                at[x] = (at[x] + ((a + ant[x]) >> 1)) & 255
        elif f == 4:
            for x in range(linha):
                a = at[x - bpp] if x >= bpp else 0
                b = ant[x]
                c = ant[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                at[x] = (at[x] + pr) & 255
        out[y * linha:(y + 1) * linha] = at
        ant = at

    def pixel(x, y):
        o = y * linha + x * 3
        return out[o], out[o + 1], out[o + 2]

    return pixel, w, h


def luminancia(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = map(f, c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contraste(a, b):
    la, lb = luminancia(a), luminancia(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)
