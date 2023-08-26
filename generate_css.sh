#!/bin/bash
for color in blue green brown;do
    # generate SVGs
    for i in {1..12};do for j in {1..10}; do sed "s#0 0 1200 1000#0 $(( 1000 - 100*j )) $(( 100*i )) $(( 100*j ))#" public/assets/images/board/${color}/${color}_base.svg > "public/assets/images/board/${color}/${color}${i}x${j}.svg";done;done
    # generate background CSS
    for i in {1..12};do for j in {1..10}; do echo -e ".${color}board.board${i}x${j} cg-board {\n  background-image: url('images/board/${color}/${color}${i}x${j}.svg');\n}";done;done > public/assets/theme-board-${color}board.css
done

# generate theme-letters CSS
rm public/assets/theme-piece-letters.css
for i in "white" "black";do
    for j in {a..z};do
        if [[ $i = "white" ]]
        then
           letter=${j^}
        else
           letter=${j}
        fi
        echo -e ".letters .cg-wrap piece.${j}-piece.${i} {background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='${i}' class='$i' text-anchor='middle' dominant-baseline='central'>${letter}</text></svg>\");}" >> public/assets/theme-piece-letters.css
        # promoted pieces
        echo -e ".letters .cg-wrap piece.p${j}-piece.${i} {background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='${i}' class='$i' text-anchor='middle' dominant-baseline='central'>+${letter}</text></svg>\");}" >> public/assets/theme-piece-letters.css
    done
done
# walls
echo -e ".letters .cg-wrap piece._-piece {background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='80px' height='80px'><text font-size='30' x='50%' y='50%' fill='red' class='red' text-anchor='middle' dominant-baseline='central'>✽</text></svg>\");}" >> public/assets/theme-piece-letters.css

# generate CSS
rm public/assets/generated.css
for i in {1..12};do
    for j in {1..10};do
        echo -e ".board${i}x${j} .cg-wrap {\n  width: $(( i > j ? 640 : 640 * i / j ))px;\n  height: $(( j > i ? 640 : 640 * j / i ))px;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j}.pockets .cg-wrap {\n  width: $(( i > j ? 640 * i / ( i + 2 )  : 640 * i / j * i / ( i + 2 ) ))px;\n  height: $(( j > i ? 640 * i / ( i + 2 ) : 640 * j / ( i + 2 ) ))px;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} cg-helper {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} cg-board square {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} .cg-wrap piece {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
    done
done
