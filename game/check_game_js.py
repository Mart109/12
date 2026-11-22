import re
import shutil
import subprocess

src = open('game.js', encoding='utf-8').read()

node = shutil.which('node')
if node:
    proc = subprocess.run([node, '--check', 'game.js'], capture_output=True, text=True)
    print('node --check rc =', proc.returncode)
    if proc.stdout.strip():
        print('stdout:', proc.stdout)
    if proc.stderr.strip():
        print('stderr:', proc.stderr)
else:
    print('node не найден, проверяю вручную')

required_ids = ['game', 'score', 'combo', 'time', 'best', 'startBtn', 'pauseBtn', 'muteBtn', 'overlay']
for el in required_ids:
    assert f"'{el}'" in src, f'не найден id {el}'
print('все id на месте')

for fn in ['startGame', 'pauseGame', 'resumeGame', 'gameOver', 'update', 'draw', 'frame']:
    assert re.search(r'function\s+' + fn + r'\s*\(', src), f'нет функции {fn}'
print('все функции на месте')

assert "'use strict'" in src
assert src.strip().startswith('(function')
assert src.strip().endswith('})();')
print('IIFE + use strict ок')

bad = ['except:', 'TODO', 'FIXME', 'def main']
for b in bad:
    assert b not in src, f'найдено запрещённое: {b}'
print('запрещённых конструкций нет')

for ch_open, ch_close in [('{', '}'), ('(', ')'), ('[', ']')]:
    assert src.count(ch_open) == src.count(ch_close), f'дисбаланс {ch_open}{ch_close}'
print('скобки сбалансированы')

print('строк в файле:', len(src.splitlines()))
