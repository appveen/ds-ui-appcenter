#!/bin/bash
set -e

if [ -f $WORKSPACE/../TOGGLE ]; then
    echo "****************************************************"
    echo "odp:sm :: Toggle mode is on, terminating build"
    echo "odp:sm :: BUILD CANCLED"
    echo "****************************************************"
    exit 0
fi

if [ -f $WORKSPACE/../ODP_RELEASE ]; then
    REL=`cat $WORKSPACE/../ODP_RELEASE`
fi

if [ $1 ]; then
    REL=$1
fi

if [ ! $REL ]; then
    echo "****************************************************"
    echo "odp:sm :: Please Create file ODP_RELEASE with the releaese at $WORKSPACE or provide it as 1st argument of this script."
    echo "odp:sm :: BUILD FAILED"
    echo "****************************************************"
    exit 0
fi

TAG=$REL

if [ $2 ]; then
    TAG=$TAG"-"$2
fi

echo "****************************************************"
echo "odp-ui-appcenter :: Building Image :: "$TAG
echo "****************************************************"
cd $WORKSPACE

# ng build --prod

docker build -t odp:ui-appcenter.$TAG .

echo $TAG > $WORKSPACE/../LATEST_APPCENTER