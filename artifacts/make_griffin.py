import os

svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
  <!-- Wing -->
  <path d="M75 62 h70 l-14 42 h-34" />
  <path d="M80 74 h56" />
  <path d="M86 86 h44" />
  <path d="M92 98 h32" />
  
  <!-- Head & Beak -->
  <path d="M145 62 c4 -10 12 -18 22 -18 c4 0 6 3 5 6 c6 -1 14 0 16 4 l-9 6 l10 2 l-12 7 c-2 10 -6 20 -14 28" />
  <!-- Eye -->
  <circle cx="164" cy="56" r="2.5" fill="currentColor" stroke="none" />
  
  <!-- Neck, Body, Legs -->
  <path d="M163 100 l14 46 h-12 l-9 -36 c-6 6 -14 10 -24 10 l4 26 h-12 l-4 -20 c-10 2 -18 -1 -24 -6 l-8 26 h-12 l7 -30 c-10 -6 -16 -16 -16 -28 c0 -14 8 -26 20 -32" />
  
  <!-- Tail -->
  <path d="M72 110 C50 110 38 92 46 76 C52 66 64 70 66 80 C68 90 54 96 44 92 C36 88 32 76 40 68" />
  <polygon points="36,66 28,70 34,76 42,72" fill="currentColor" stroke="none" />

  <!-- Pedestal Top -->
  <polygon points="68,154 195,150 195,168 68,172" />
  
  <!-- Pedestal Bottom -->
  <polygon points="52,176 195,174 195,192 52,192" />
</svg>"""

with open('artifacts/griffin_test.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)
print("Saved griffin_test.svg")
