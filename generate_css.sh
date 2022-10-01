#!/bin/bash
# generate SVGs
for i in {1..12};do for j in {1..10}; do sed "s#0 0 1000 1000#0 $(( 1000 - 100*j )) $(( 100*i )) $(( 100*j ))#" public/assets/images/board/blue_base.svg > "public/assets/images/board/blue${i}x${j}.svg";done;done
# generate background CSS
for i in {1..12};do for j in {1..10}; do echo -e ".blue.board${i}x${j} cg-board {\n  background-image: url('images/board/blue${i}x${j}.svg');\n}";done;done > public/assets/theme-backgrounds.css

# generate CSS
rm public/assets/generated.css
for i in {1..12};do
    for j in {1..10};do
        echo -e ".board${i}x${j} .cg-wrap {\n  width: $(( i > j ? 640 : 640 * i / j ))px;\n  height: $(( j > i ? 640 : 640 * j / i ))px;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} cg-helper {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} cg-board square {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
        echo -e ".board${i}x${j} .cg-wrap piece {\n  width: $(echo "scale=5;100 / ${i}" | bc)%;\n  height: $(echo "scale=5;100 / ${j}" | bc)%;\n}" >> public/assets/generated.css
    done
done
