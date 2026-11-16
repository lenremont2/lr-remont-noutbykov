import math

def generate_medallion_svg():
    cx, cy = 120, 100
    r_outer = 85
    r_inner = 76
    petals = 28
    
    # Generate scalloped path
    d_scallop = []
    for i in range(petals):
        angle1 = 2 * math.pi * i / petals
        angle_mid = 2 * math.pi * (i + 0.5) / petals
        angle2 = 2 * math.pi * (i + 1) / petals
        
        x1 = cx + r_inner * math.cos(angle1)
        y1 = cy + r_inner * math.sin(angle1)
        x_tip = cx + r_outer * math.cos(angle_mid)
        y_tip = cy + r_outer * math.sin(angle_mid)
        x2 = cx + r_inner * math.cos(angle2)
        y2 = cy + r_inner * math.sin(angle2)
        
        if i == 0:
            d_scallop.append(f"M {x1:.2f} {y1:.2f}")
        d_scallop.append(f"Q {x_tip:.2f} {y_tip:.2f} {x2:.2f} {y2:.2f}")
    d_scallop.append("Z")
    
    # 5 stars across top arc (angles from -140 deg to -40 deg)
    star_paths = []
    star_angles = [-135, -112.5, -90, -67.5, -45]
    star_r = 60
    for sa in star_angles:
        rad = math.radians(sa)
        sx = cx + star_r * math.cos(rad)
        sy = cy + star_r * math.sin(rad)
        # 5-point star at sx, sy with r=5
        pts = []
        for p in range(10):
            p_rad = math.radians(sa + p * 36 - 90) # align point outward
            p_r = 5 if p % 2 == 0 else 2.5
            px = sx + p_r * math.cos(math.radians(p * 36 - 90))
            py = sy + p_r * math.sin(math.radians(p * 36 - 90))
            pts.append(f"{px:.1f},{py:.1f}")
        star_paths.append(f'<polygon points="{" ".join(pts)}" fill="currentColor" />')
        
    svg = f'''---
---

<svg viewBox="0 0 240 200" fill="none" stroke="currentColor" aria-hidden="true">
  <!-- Outer scalloped border -->
  <path d="{" ".join(d_scallop)}" fill="currentColor" fill-opacity="0.12" stroke="currentColor" stroke-width="2.5" />
  <!-- Inner ring -->
  <circle cx="{cx}" cy="{cy}" r="68" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2" />
  <circle cx="{cx}" cy="{cy}" r="64" stroke="currentColor" stroke-width="1.5" />
  <!-- Arc of stars -->
  {" ".join(star_paths)}
  <!-- Bottom ribbon banner -->
  <path d="M 60 160 L 45 180 L 70 174 L 120 178 L 170 174 L 195 180 L 180 160 Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
  <path d="M 68 160 Q 120 170 172 160 L 172 172 Q 120 182 68 172 Z" fill="currentColor" stroke="currentColor" stroke-width="2" />
</svg>'''
    return svg

with open('src/components/ui/AwardMedallion.astro', 'w', encoding='utf-8') as f:
    f.write(generate_medallion_svg())
print("AwardMedallion.astro generated successfully")
