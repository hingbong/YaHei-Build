#!/bin/bash
chmod +x SourceHanToClassic/main/otfcc/*
mkdir out
cd SourceHanToClassic/main 
ls ../../src/ | xargs -I{} python3 sourcehantocl.py ../../src/{} ../../out/{} n 1 1 3 2
cd ../..
