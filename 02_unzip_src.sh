#!/bin/bash
ls src/*.zip | xargs -I{} 7z x -osrc/fonts {}
