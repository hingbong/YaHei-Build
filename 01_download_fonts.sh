#!/bin/bash
free -h
lscpu
P=${GITHUB_WORKSPACE}
cd $P
mkdir src
SOURCE_FILE_LINK=$P/source_link.json
for link in `sed "s/UPSTREAM_VERSION/$UPSTREAM_VERSION/g" $SOURCE_FILE_LINK | jq -r '.[]'`; do
	echo $link
	curl --output-dir src -OL "$link"
done
ls -lh src/*
