#!/bin/bash
export PATH=$PATH:/github/home/.local/bin
ls src/fonts/*.ttc| xargs -I {} otc2otf {} || exit 1
ls src/fonts
echo "--------------------"
ls
echo "--------------------"
mkdir src/fonts/ttf/
cp src/fonts/*.ttf src/fonts/ttf/
regions=(
"HC"
"K"
"SC"
"TC"
)
for region in ${regions[@]}; do
	fonts=`ls src/fonts/ttf/*${region}-*.ttf`
	for font in ${fonts[@]}; do
		echo $font
		rm -f $font
	done
done
