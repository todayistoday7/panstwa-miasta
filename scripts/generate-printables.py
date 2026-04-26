#!/usr/bin/env python3
"""
Generate print-and-play PDF game sheets for panstwamiastagra.com
Light background, minimal ink, QR code + branding, tiny rules box.
"""

import os
import qrcode
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

W, H = A4  # 210mm x 297mm
ACCENT = HexColor('#ff6b35')
ACCENT2 = HexColor('#06d6a0')
MUTED = HexColor('#94a3b8')
LIGHT_BG = HexColor('#f8fafc')
BORDER = HexColor('#e2e8f0')
DARK = HexColor('#1e293b')

OUT_DIR = '/home/claude/panstwa-miasta-multiplayer/public/downloads'
os.makedirs(OUT_DIR, exist_ok=True)

BASE_URL = 'https://panstwamiastagra.com'


def make_qr(url, size=25*mm):
    """Generate a QR code image."""
    qr = qrcode.QRCode(version=1, box_size=10, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color='black', back_color='white')
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return ImageReader(buf), size


def draw_header(c, title, subtitle, url):
    """Draw the branded header with logo and QR."""
    # Logo area
    c.setFont('Helvetica-Bold', 24)
    c.setFillColor(ACCENT)
    c.drawString(20*mm, H - 18*mm, '🎮')
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(DARK)
    c.drawString(32*mm, H - 17*mm, title)

    c.setFont('Helvetica', 9)
    c.setFillColor(MUTED)
    c.drawString(32*mm, H - 22*mm, subtitle)

    # QR code top-right
    qr_img, qr_size = make_qr(url)
    c.drawImage(qr_img, W - 20*mm - qr_size, H - 10*mm - qr_size, qr_size, qr_size)
    c.setFont('Helvetica', 6)
    c.setFillColor(MUTED)
    c.drawCentredString(W - 20*mm - qr_size/2, H - 12*mm - qr_size, url.replace('https://', ''))

    # Separator line
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(15*mm, H - 28*mm, W - 15*mm, H - 28*mm)


def draw_footer(c, rules_text, url):
    """Draw footer with mini rules and branding."""
    footer_y = 12*mm

    # Rules box
    c.setStrokeColor(BORDER)
    c.setFillColor(HexColor('#f1f5f9'))
    c.roundRect(15*mm, footer_y - 2*mm, W - 30*mm, 18*mm, 3*mm, fill=1, stroke=1)

    c.setFont('Helvetica-Bold', 7)
    c.setFillColor(ACCENT)
    c.drawString(18*mm, footer_y + 12*mm, '📖 RULES:')

    c.setFont('Helvetica', 6.5)
    c.setFillColor(DARK)
    # Split rules into lines
    lines = rules_text.split('\n')
    y = footer_y + 9*mm
    for line in lines:
        c.drawString(18*mm, y, line)
        y -= 3*mm

    # Branding
    c.setFont('Helvetica', 6)
    c.setFillColor(MUTED)
    c.drawRightString(W - 18*mm, footer_y - 5*mm, f'panstwamiastagra.com · Free online multiplayer games')


# ═══════════════════════════════════════════════════════════
# 1. STADT LAND FLUSS / PAŃSTWA MIASTA
# ═══════════════════════════════════════════════════════════

def create_slf(lang='de'):
    configs = {
        'de': {
            'title': 'Stadt Land Fluss',
            'subtitle': 'Druckvorlage · Kostenlos · panstwamiastagra.com',
            'url': f'{BASE_URL}/stadt-land-fluss-online',
            'headers': ['Stadt', 'Land', 'Fluss', 'Name', 'Tier', 'Beruf', '', ''],
            'filename': 'stadt-land-fluss-druckvorlage.pdf',
            'letter_label': 'Buchstabe',
            'score_label': 'Punkte',
            'rules': 'Ein zufälliger Buchstabe wird gewählt. Alle füllen gleichzeitig jede Kategorie aus.\nWer zuerst fertig ist, ruft STOPP. Einzigartige Antwort = 10 Pkt, doppelte = 5 Pkt, leer = 0 Pkt.\nMeiste Punkte nach allen Runden gewinnt. Spiel auch online: panstwamiastagra.com',
        },
        'pl': {
            'title': 'Państwa Miasta',
            'subtitle': 'Karta do druku · Za darmo · panstwamiastagra.com',
            'url': f'{BASE_URL}/',
            'headers': ['Państwo', 'Miasto', 'Rzeka', 'Imię', 'Zwierzę', 'Zawód', '', ''],
            'filename': 'panstwa-miasta-karta-do-druku.pdf',
            'letter_label': 'Litera',
            'score_label': 'Punkty',
            'rules': 'Losujecie literę. Wszyscy jednocześnie wypełniają kategorie na wybraną literę.\nKto skończy pierwszy, mówi STOP. Unikalna odpowiedź = 10 pkt, powtórzona = 5 pkt, brak = 0 pkt.\nNajwięcej punktów po wszystkich rundach wygrywa. Zagraj online: panstwamiastagra.com',
        },
        'en': {
            'title': 'Countries & Cities',
            'subtitle': 'Print & Play Sheet · Free · panstwamiastagra.com',
            'url': f'{BASE_URL}/countries-cities-game',
            'headers': ['Country', 'City', 'River', 'Name', 'Animal', 'Profession', '', ''],
            'filename': 'countries-cities-print-and-play.pdf',
            'letter_label': 'Letter',
            'score_label': 'Score',
            'rules': 'Pick a random letter. Everyone fills in each category at the same time.\nFirst to finish calls STOP. Unique answer = 10 pts, shared = 5 pts, blank = 0 pts.\nMost points after all rounds wins. Play online: panstwamiastagra.com',
        },
        'sv': {
            'title': 'Stad Land',
            'subtitle': 'Utskriftsmall · Gratis · panstwamiastagra.com',
            'url': f'{BASE_URL}/laender-och-staeder',
            'headers': ['Land', 'Stad', 'Flod', 'Namn', 'Djur', 'Yrke', '', ''],
            'filename': 'stad-land-utskrift.pdf',
            'letter_label': 'Bokstav',
            'score_label': 'Poäng',
            'rules': 'Välj en slumpmässig bokstav. Alla fyller i varje kategori samtidigt.\nFörst klar ropar STOPP. Unikt svar = 10 p, delat = 5 p, tomt = 0 p.\nFlest poäng efter alla rundor vinner. Spela online: panstwamiastagra.com',
        },
    }

    cfg = configs[lang]
    filepath = os.path.join(OUT_DIR, cfg['filename'])
    c = canvas.Canvas(filepath, pagesize=A4)

    draw_header(c, cfg['title'], cfg['subtitle'], cfg['url'])

    # Grid
    num_cols = len(cfg['headers'])  # 8 columns (6 categories + 2 blank)
    num_rows = 12  # 12 rounds
    left = 15*mm
    top = H - 34*mm
    col_w = (W - 30*mm - 18*mm) / num_cols  # subtract space for letter + score columns
    letter_w = 10*mm
    score_w = 10*mm  # narrower score column
    row_h = 14*mm

    # Adjust: letter column + category columns + score column
    total_w = letter_w + num_cols * col_w + score_w
    # Recalculate col_w to fit
    col_w = (W - 30*mm - letter_w - score_w) / num_cols

    # Header row
    c.setFillColor(HexColor('#f1f5f9'))
    c.rect(left, top - 8*mm, letter_w + num_cols * col_w + score_w, 8*mm, fill=1, stroke=0)

    c.setFont('Helvetica-Bold', 7)
    c.setFillColor(ACCENT)
    c.drawCentredString(left + letter_w/2, top - 6*mm, cfg['letter_label'])

    c.setFillColor(DARK)
    for i, h in enumerate(cfg['headers']):
        x = left + letter_w + i * col_w + col_w/2
        if h:
            c.drawCentredString(x, top - 6*mm, h)
        else:
            c.setFillColor(MUTED)
            c.setFont('Helvetica-Oblique', 6)
            c.drawCentredString(x, top - 6*mm, '...')
            c.setFont('Helvetica-Bold', 7)
            c.setFillColor(DARK)

    c.setFillColor(ACCENT)
    c.drawCentredString(left + letter_w + num_cols * col_w + score_w/2, top - 6*mm, cfg['score_label'])

    # Grid lines
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.4)

    for row in range(num_rows + 1):
        y = top - 8*mm - row * row_h
        c.line(left, y, left + letter_w + num_cols * col_w + score_w, y)

    # Vertical lines
    c.line(left, top, left, top - 8*mm - num_rows * row_h)
    c.line(left + letter_w, top, left + letter_w, top - 8*mm - num_rows * row_h)
    for i in range(num_cols + 1):
        x = left + letter_w + i * col_w
        c.line(x, top, x, top - 8*mm - num_rows * row_h)
    c.line(left + letter_w + num_cols * col_w + score_w, top, left + letter_w + num_cols * col_w + score_w, top - 8*mm - num_rows * row_h)

    # Row numbers in letter column (light)
    c.setFont('Helvetica', 8)
    c.setFillColor(HexColor('#cbd5e1'))
    for row in range(num_rows):
        y = top - 8*mm - row * row_h - row_h/2 - 2
        c.drawCentredString(left + letter_w/2, y, str(row + 1))

    draw_footer(c, cfg['rules'], cfg['url'])
    c.save()
    print(f'✓ {cfg["filename"]} ({lang})')
    return filepath


# ═══════════════════════════════════════════════════════════
# 2. KÄSEKÄSTCHEN / DOTS & BOXES (language-free)
# ═══════════════════════════════════════════════════════════

def create_dots():
    filepath = os.path.join(OUT_DIR, 'dots-and-boxes-print-and-play.pdf')
    c = canvas.Canvas(filepath, pagesize=A4)

    draw_header(c, 'Dots & Boxes / Käsekästchen',
                'Print & Play · Free · panstwamiastagra.com',
                f'{BASE_URL}/dots-and-boxes-online')

    # Draw 2 grids side by side
    grids = [
        {'rows': 6, 'cols': 6, 'label': '6×6'},
        {'rows': 8, 'cols': 8, 'label': '8×8'},
    ]

    grid_top = H - 38*mm
    gap = 8*mm
    dot_r = 1.8
    total_width = W - 30*mm

    for gi, g in enumerate(grids):
        grid_w = total_width / 2 - gap/2
        spacing = min(grid_w / (g['cols'] - 1), (grid_top - 65*mm) / (g['rows'] - 1))
        # Center the grid in its half
        gx = 15*mm + gi * (total_width/2 + gap/2)
        actual_w = spacing * (g['cols'] - 1)
        actual_h = spacing * (g['rows'] - 1)
        offset_x = (grid_w - actual_w) / 2
        gy = grid_top

        # Grid label
        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(ACCENT)
        c.drawCentredString(gx + grid_w/2, gy + 5*mm, g['label'])

        # Player boxes
        c.setFont('Helvetica', 7)
        c.setFillColor(MUTED)
        c.drawString(gx + offset_x, gy + 14*mm, f"Player 1: ___  □")
        c.drawRightString(gx + offset_x + actual_w, gy + 14*mm, f"Player 2: ___  □")

        # Draw dots
        c.setFillColor(DARK)
        for row in range(g['rows']):
            for col in range(g['cols']):
                x = gx + offset_x + col * spacing
                y = gy - row * spacing
                c.circle(x, y, dot_r, fill=1, stroke=0)

    # Second pair of grids below
    grid_top2 = grid_top - max(g['rows'] for g in grids) * spacing - 30*mm
    grids2 = [
        {'rows': 6, 'cols': 6, 'label': '6×6'},
        {'rows': 10, 'cols': 10, 'label': '10×10'},
    ]

    for gi, g in enumerate(grids2):
        grid_w = total_width / 2 - gap/2
        spacing2 = min(grid_w / (g['cols'] - 1), (grid_top2 - 45*mm) / (g['rows'] - 1), spacing)
        gx = 15*mm + gi * (total_width/2 + gap/2)
        actual_w = spacing2 * (g['cols'] - 1)
        actual_h = spacing2 * (g['rows'] - 1)
        offset_x = (grid_w - actual_w) / 2

        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(ACCENT)
        c.drawCentredString(gx + grid_w/2, grid_top2 + 5*mm, g['label'])

        c.setFont('Helvetica', 7)
        c.setFillColor(MUTED)
        c.drawString(gx + offset_x, grid_top2 + 14*mm, f"Player 1: ___  □")
        c.drawRightString(gx + offset_x + actual_w, grid_top2 + 14*mm, f"Player 2: ___  □")

        c.setFillColor(DARK)
        for row in range(g['rows']):
            for col in range(g['cols']):
                x = gx + offset_x + col * spacing2
                y = grid_top2 - row * spacing2
                c.circle(x, y, dot_r, fill=1, stroke=0)

    rules = 'Take turns drawing a line between two adjacent dots. Close a box = your point + extra turn.\nMost boxes wins. Works for 2-4 players. Play online: panstwamiastagra.com/dots-and-boxes-online'
    draw_footer(c, rules, f'{BASE_URL}/dots-and-boxes-online')

    c.save()
    print(f'✓ dots-and-boxes-print-and-play.pdf')
    return filepath


# ═══════════════════════════════════════════════════════════
# GENERATE ALL
# ═══════════════════════════════════════════════════════════

if __name__ == '__main__':
    files = []
    # Stadt Land Fluss in 4 languages
    for lang in ['de', 'pl', 'en', 'sv']:
        files.append(create_slf(lang))

    # Dots & Boxes (universal)
    files.append(create_dots())

    print(f'\n✅ {len(files)} PDFs generated in {OUT_DIR}/')
    for f in files:
        size = os.path.getsize(f)
        print(f'   {os.path.basename(f)} ({size//1024} KB)')
