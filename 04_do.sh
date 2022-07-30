#!/bin/bash
chmod +x SourceHanToClassic/main/otfcc/*
mkdir out
cd SourceHanToClassic/main 
ls ../../src/fonts/ttf/ | xargs -I{} python3 sourcehantocl.py ../../src/fonts/ttf/{} ../../out/{} n 1 1 n 2
cd ../..
