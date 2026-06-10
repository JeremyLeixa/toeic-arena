# -*- coding: utf-8 -*-
"""Genere la carte A4 imprimable "Qu'est-ce qui fait des points ?" pour les eleves."""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle)

OUT = os.path.join(os.path.expanduser("~"), "Desktop", "toeic_arena_carte_points.pdf")

# Palette (ramps Imagine)
INK = colors.HexColor("#2C2C2A")
MUT = colors.HexColor("#5F5E5A")
AMB_BG, AMB_HEAD, AMB_INK = colors.HexColor("#FAEEDA"), colors.HexColor("#633806"), colors.HexColor("#412402")
BLU_BG, BLU_HEAD, BLU_INK = colors.HexColor("#E6F1FB"), colors.HexColor("#0C447C"), colors.HexColor("#042C53")
PUR_BG, PUR_INK = colors.HexColor("#EEEDFE"), colors.HexColor("#3C3489")
GRN_BG, GRN_INK = colors.HexColor("#EAF3DE"), colors.HexColor("#27500A")
GRY_BG, GRY_INK = colors.HexColor("#F1EFE8"), colors.HexColor("#5F5E5A")
LINE = colors.HexColor("#D3D1C7")

st_title = ParagraphStyle("t", fontName="Helvetica-Bold", fontSize=19, textColor=INK, leading=22)
st_sub = ParagraphStyle("s", fontName="Helvetica-Oblique", fontSize=10.5, textColor=MUT, leading=14)
st_sec = ParagraphStyle("sec", fontName="Helvetica-Bold", fontSize=11, textColor=MUT, leading=14)
st_boxhead = ParagraphStyle("bh", fontName="Helvetica-Bold", fontSize=12, leading=15)
st_li = ParagraphStyle("li", fontName="Helvetica", fontSize=10, leading=14)
st_ital = ParagraphStyle("it", fontName="Helvetica-Oblique", fontSize=9, leading=12)
st_chip = ParagraphStyle("chip", fontName="Helvetica", fontSize=9.5, leading=11, alignment=1)
st_rowlab = ParagraphStyle("rl", fontName="Helvetica-Bold", fontSize=10, leading=12)
st_note = ParagraphStyle("nt", fontName="Helvetica-Oblique", fontSize=9, textColor=MUT, leading=12)
st_rule = ParagraphStyle("ru", fontName="Helvetica", fontSize=9.5, textColor=INK, leading=13)


def box_cell(head, head_col, ink, lines, italic):
    flow = [Paragraph(head, ParagraphStyle("h", parent=st_boxhead, textColor=head_col))]
    for ln in lines:
        flow.append(Spacer(1, 4))
        flow.append(Paragraph(ln, ParagraphStyle("l", parent=st_li, textColor=ink)))
    flow.append(Spacer(1, 6))
    flow.append(Paragraph(italic, ParagraphStyle("i", parent=st_ital, textColor=head_col)))
    return flow


def chip_grid(items, bg, ink, ncols, total_w):
    cells = [Paragraph(it, ParagraphStyle("c", parent=st_chip, textColor=ink)) for it in items]
    while len(cells) % ncols != 0:
        cells.append("")
    rows = [cells[i:i + ncols] for i in range(0, len(cells), ncols)]
    cw = total_w / ncols
    t = Table(rows, colWidths=[cw] * ncols)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("INNERGRID", (0, 0), (-1, -1), 2.2, colors.white),
        ("BOX", (0, 0), (-1, -1), 2.2, colors.white),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def labeled_row(label, lab_col, grid, total_w):
    lab = Paragraph(label, ParagraphStyle("rl", parent=st_rowlab, textColor=lab_col))
    t = Table([[lab, grid]], colWidths=[2.6 * cm, total_w - 2.6 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (0, 0), 3),
    ]))
    return t


def build():
    doc = SimpleDocTemplate(OUT, pagesize=A4, leftMargin=1.4 * cm, rightMargin=1.4 * cm,
                            topMargin=1.3 * cm, bottomMargin=1.2 * cm,
                            title="TOEIC Arena - Qu'est-ce qui fait des points")
    W = A4[0] - 2.8 * cm
    s = []
    s.append(Paragraph("Qu'est-ce qui fait des points&nbsp;?", st_title))
    s.append(Spacer(1, 2))
    s.append(Paragraph("TOEIC Arena &mdash; deux choses diff&eacute;rentes, ne les confonds pas.", st_sub))
    s.append(Spacer(1, 12))

    # Two currency boxes
    xp = box_cell("Les XP &mdash; ton niveau &amp; le classement", AMB_HEAD, AMB_INK,
                  ["&bull;&nbsp; Presque <b>tout</b> en donne&nbsp;: chaque module, chaque jeu, le Daily.",
                   "&bull;&nbsp; Sauf les <b>Flashcards</b> (0 XP)."],
                  "Plus tu r&eacute;ponds juste, plus tu gagnes d'XP.")
    sc = box_cell("Le score TOEIC estim&eacute;", BLU_HEAD, BLU_INK,
                  ["&bull;&nbsp; Tout ce que tu <b>travailles</b> compte (voir ci-dessous).",
                   "&bull;&nbsp; Sauf <b>Flashcards</b> &amp; <b>jeux d'arcade</b>."],
                  "C'est ta pr&eacute;cision qui le fait monter, pas ton temps.")
    box = Table([[xp, sc]], colWidths=[W / 2, W / 2])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), AMB_BG),
        ("BACKGROUND", (1, 0), (1, 0), BLU_BG),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LINEAFTER", (0, 0), (0, 0), 3, colors.white),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    s.append(box)
    s.append(Spacer(1, 16))

    s.append(Paragraph("Ce qui fait monter ton score TOEIC", st_sec))
    s.append(Spacer(1, 8))

    listening = ["&Eacute;coute P1", "&Eacute;coute P2", "&Eacute;coute P3", "&Eacute;coute P4", "Audio Blitz"]
    reading = ["Part 5", "Part 6", "Part 7", "Grammar Gauntlet", "Word Families", "Connectors",
               "Pr&eacute;positions", "G&eacute;rondif / Infinitif", "Phrasal Verbs", "False Friends",
               "Sentence Builder", "Word Tavern", "Clue Hunter", "TOEIC Traps", "Modal Council",
               "Linking Bridge", "Time Sim", "Strategy Quiz", "Daily"]
    tests = ["Mock 1 / 2 / 3", "Boss", "Endless Arena"]

    s.append(labeled_row("Listening", BLU_HEAD, chip_grid(listening, BLU_BG, BLU_INK, 5, W - 2.6 * cm), W))
    s.append(Spacer(1, 7))
    s.append(labeled_row("Reading", PUR_INK, chip_grid(reading, PUR_BG, PUR_INK, 4, W - 2.6 * cm), W))
    s.append(Spacer(1, 7))
    s.append(labeled_row("Tests", GRN_INK, chip_grid(tests, GRN_BG, GRN_INK, 3, W - 2.6 * cm), W))
    s.append(Spacer(1, 2))
    tw = Table([["", Paragraph("Les tests d&eacute;bloquent ton score et l'affinent.", st_note)]],
               colWidths=[2.6 * cm, W - 2.6 * cm])
    tw.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 2)]))
    s.append(tw)
    s.append(Spacer(1, 14))

    # Exceptions
    s.append(Paragraph("Ne comptent <b>pas</b> pour le score (XP &amp; fun seulement)", st_sec))
    s.append(Spacer(1, 7))
    s.append(chip_grid(["Flashcards", "Word Fall", "Speed Match", "Duel"], GRY_BG, GRY_INK, 4, W))
    s.append(Spacer(1, 16))

    # Golden rules
    r1 = [Paragraph("R&egrave;gle d'or n&deg;1", ParagraphStyle("r1", parent=st_boxhead, fontSize=11, textColor=INK)),
          Spacer(1, 4),
          Paragraph("Le score mesure ta <b>pr&eacute;cision</b>, pas ton temps. 20 questions comprises valent mieux que 200 cliqu&eacute;es.", st_rule)]
    r2 = [Paragraph("R&egrave;gle d'or n&deg;2", ParagraphStyle("r2", parent=st_boxhead, fontSize=11, textColor=INK)),
          Spacer(1, 4),
          Paragraph("Pour un score <b>total</b>, travaille le Listening <b>et</b> le Reading &mdash; ou passe un Mock test.", st_rule)]
    rules = Table([[r1, r2]], colWidths=[W / 2, W / 2])
    rules.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 1, LINE),
        ("LINEAFTER", (0, 0), (0, 0), 1, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12), ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 12), ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
    ]))
    s.append(rules)

    doc.build(s)
    print("PDF ecrit :", OUT)


if __name__ == "__main__":
    build()
