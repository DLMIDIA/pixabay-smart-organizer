import os
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background (RGBA)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    padding = max(1, int(size * 0.08))
    radius = max(2, int(size * 0.22))
    
    # Background: vibrant teal/emerald (Pixabay-inspired green + tech blue)
    # Draw rounded rectangle
    x0, y0 = padding, padding
    x1, y1 = size - padding, size - padding
    
    # Gradient background simulated via color
    bg_color = (0, 171, 107, 255) # Pixabay Emerald #00ab6b
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=bg_color)
    
    # Inner border for polish
    border_color = (255, 255, 255, 80)
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=border_color, width=max(1, int(size * 0.03)))
    
    # Folder tab at top
    tab_w = int(size * 0.35)
    tab_h = int(size * 0.12)
    tab_x0 = x0 + int(size * 0.08)
    tab_y0 = y0 + int(size * 0.12)
    draw.rounded_rectangle([tab_x0, tab_y0, tab_x0 + tab_w, tab_y0 + tab_h], radius=max(1, int(size * 0.04)), fill=(255, 255, 255, 220))
    
    # Folder body
    body_x0 = x0 + int(size * 0.08)
    body_y0 = tab_y0 + int(size * 0.08)
    body_x1 = x1 - int(size * 0.08)
    body_y1 = y1 - int(size * 0.12)
    draw.rounded_rectangle([body_x0, body_y0, body_x1, body_y1], radius=max(1, int(size * 0.05)), fill=(255, 255, 255, 240))
    
    # Download arrow inside folder
    arrow_color = (0, 150, 94, 255)
    cx = size // 2
    arrow_top = body_y0 + int((body_y1 - body_y0) * 0.2)
    arrow_bottom = body_y0 + int((body_y1 - body_y0) * 0.65)
    stem_w = max(1, int(size * 0.08))
    
    # Vertical stem
    draw.line([(cx, arrow_top), (cx, arrow_bottom)], fill=arrow_color, width=stem_w)
    
    # Arrow head (triangle)
    head_size = max(2, int(size * 0.15))
    draw.polygon([
        (cx - head_size, arrow_bottom - head_size // 2),
        (cx + head_size, arrow_bottom - head_size // 2),
        (cx, arrow_bottom + head_size // 2)
    ], fill=arrow_color)
    
    # Bottom tray line
    tray_y = body_y1 - int((body_y1 - body_y0) * 0.15)
    tray_w = int(size * 0.3)
    draw.line([(cx - tray_w // 2, tray_y), (cx + tray_w // 2, tray_y)], fill=arrow_color, width=max(1, int(size * 0.06)))
    
    return img

def create_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c878"/>
      <stop offset="100%" stop-color="#008f58"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background Card -->
  <rect x="8" y="8" width="112" height="112" rx="24" fill="url(#bg)" filter="url(#shadow)"/>
  <rect x="8" y="8" width="112" height="112" rx="24" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2"/>
  
  <!-- Folder Tab -->
  <rect x="22" y="26" width="40" height="16" rx="4" fill="#ffffff" opacity="0.9"/>
  <!-- Folder Body -->
  <rect x="22" y="36" width="84" height="66" rx="8" fill="#ffffff"/>
  
  <!-- Down Arrow -->
  <line x1="64" y1="48" x2="64" y2="76" stroke="#00ab6b" stroke-width="8" stroke-linecap="round"/>
  <polygon points="50,70 78,70 64,84" fill="#00ab6b"/>
  <!-- Tray Line -->
  <line x1="44" y1="92" x2="84" y2="92" stroke="#00ab6b" stroke-width="6" stroke-linecap="round"/>
</svg>'''

icons_dir = os.path.dirname(os.path.abspath(__file__))
for s in [16, 48, 128]:
    img = create_icon(s)
    path = os.path.join(icons_dir, f'icon{s}.png')
    img.save(path, 'PNG')
    print(f"Generated {path} ({s}x{s})")

svg_path = os.path.join(icons_dir, 'icon.svg')
with open(svg_path, 'w', encoding='utf-8') as f:
    f.write(create_svg())
print(f"Generated {svg_path}")
