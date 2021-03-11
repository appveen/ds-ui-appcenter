#!/bin/bash
set -e

if [ -f $WORKSPACE/../TOGGLE ]; then
    echo "****************************************************"
    echo "data.stack:sm :: Toggle mode is on, terminating build"
    echo "data.stack:sm :: BUILD CANCLED"
    echo "****************************************************"
    exit 0
fi

if [ -f $WORKSPACE/../DATA_STACK_RELEASE ]; then
    REL=`cat $WORKSPACE/../DATA_STACK_RELEASE`
fi

if [ $1 ]; then
    REL=$1
fi

if [ ! $REL ]; then
    echo "****************************************************"
    echo "data.stack:sm :: Please Create file DATA_STACK_RELEASE with the releaese at $WORKSPACE or provide it as 1st argument of this script."
    echo "data.stack:sm :: BUILD FAILED"
    echo "****************************************************"
    exit 0
fi

TAG=$REL

if [ $2 ]; then
    TAG=$TAG"-"$2
fi

echo "****************************************************"
echo "ds-ui-appcenter :: Building Image :: "$TAG
echo "****************************************************"
cd $WORKSPACE

# ng build --prod

docker build -t data.stack:ui-appcenter.$TAG .

echo $TAG > $WORKSPACE/../LATEST_APPCENTER