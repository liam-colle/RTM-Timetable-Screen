# RTM API Example

## Get all metro line IDs

```plaintext
https://api.rtm.fr/front/getLines/metro
```

## Get all bus line IDs

https://api.rtm.fr/front/getLines/bus

## Get all traffic alerts and related lines

https://api.rtm.fr/front/getAlertes/FR/All

# Get line ID "RTM:LNE:116" (Metro __M1__)

https://api.rtm.fr/front/getRoutes/RTM:LNE:116

# Get stop info for line ID "RTM:LNE:116" (Metro __M1__)

https://api.rtm.fr/front/getStations/RTM:RTE:9000116RTMA

# Get realtime stop info for line ID "RTM:LNE:116" (Metro __M1__) and for stop ID "RTM:PNT:00002275" ("Stop 'La Rose'")

https://api.rtm.fr/front/getReelTime?lineRef=RTM:LNE:116&direction=1&pointRef=RTM:PNT:00002275

> [!IMPORTANT]
> This isn't a real realtime endpoint, it gives you info about what the latest realtime timestamp of arrival for the next trains were.
> The official website spaces each request of this kind for a single line by 5 minutes.
