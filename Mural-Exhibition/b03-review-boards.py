"""Contact boards of actual browser captures only; original PNGs remain intact."""
from pathlib import Path
from PIL import Image,ImageDraw
out=Path(__file__).resolve().parent.parent/'docs/validation/b03-v2-2026-10-06'
for size in ('1920x1080','1440x900','1366x768','1280x800'):
    board=Image.new('RGB',(1488,1028),'#0c151b');draw=ImageDraw.Draw(board)
    draw.text((24,12),f'B03 V2 / ACTUAL BROWSER / {size} / VISUAL CANDIDATE',fill='#e3d1b5')
    for n,state in enumerate(('gallery-default','gallery-index','cyber-default','cyber-revealed')):
        x=24+(n%2)*744;y=48+(n//2)*490
        draw.text((x,y),state,fill='#c5a576')
        with Image.open(out/f'{state}-{size}.png') as im:
            im=im.convert('RGB');im.thumbnail((720,450),Image.Resampling.LANCZOS);board.paste(im,(x,y+24))
    board.save(out/f'review-board-{size}.jpg',quality=92)
