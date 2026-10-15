# RTM API scrapping guidelines

During your scrapping of the RTM API, you will have the following guidelines.

## Scrapping format

You'll generate a json file for each line that contains information of every single stop, like shown in this example

Filename: ``docs/lines/metro/m1.json``
```json
{
    "id": "RTM:LNE:116",
    "name": "M1",
    "directionIds": {
        "La Fourragère": "RTM:RTE:9000116RTMA",
        "La Rose": "RTM:RTE:9000116RTMR"
    },
    "stationIds": {
        "RTM:RTE:9000116RTMA": [
            {
                "id": "RTM:PNT:00002275",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Rose",
                "Longitude": "5.4296345",
                "Latitude": "43.333138"
            },
            {
                "id": "RTM:PNT:00002277",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Frais Vallon",
                "Longitude": "5.4232015",
                "Latitude": "43.3255405"
            },
            {
                "id": "RTM:PNT:00002278",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Malpassé",
                "Longitude": "5.4164315",
                "Latitude": "43.3209855"
            },
            {
                "id": "RTM:PNT:00002279",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Just",
                "Longitude": "5.406393",
                "Latitude": "43.315486"
            },
            {
                "id": "RTM:PNT:00002280",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Chartreux",
                "Longitude": "5.401397",
                "Latitude": "43.309159"
            },
            {
                "id": "RTM:PNT:00002281",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Cinq Avenues Longchamp",
                "Longitude": "5.396111",
                "Latitude": "43.3041025"
            },
            {
                "id": "RTM:PNT:00002282",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Réformés Canebière",
                "Longitude": "5.386163",
                "Latitude": "43.3004195"
            },
            {
                "id": "RTM:PNT:00002283",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Charles",
                "Longitude": "5.3801525",
                "Latitude": "43.3023705"
            },
            {
                "id": "RTM:PNT:00002284",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Colbert",
                "Longitude": "5.374338",
                "Latitude": "43.3003195"
            },
            {
                "id": "RTM:PNT:00002285",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Vieux-Port",
                "Longitude": "5.3741815",
                "Latitude": "43.295639"
            },
            {
                "id": "RTM:PNT:00002286",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Estrangin",
                "Longitude": "5.3779635",
                "Latitude": "43.29031"
            },
            {
                "id": "RTM:PNT:00002287",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Castellane",
                "Longitude": "5.384552",
                "Latitude": "43.2861185"
            },
            {
                "id": "RTM:PNT:00002302",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Baille",
                "Longitude": "5.3920085",
                "Latitude": "43.288089"
            },
            {
                "id": "RTM:PNT:00002303",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Timone",
                "Longitude": "5.4004835",
                "Latitude": "43.291122"
            },
            {
                "id": "RTM:PNT:00003489",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Blancarde",
                "Longitude": "5.406199",
                "Latitude": "43.295438"
            },
            {
                "id": "RTM:PNT:00003490",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Louis Armand",
                "Longitude": "5.41363",
                "Latitude": "43.299951"
            },
            {
                "id": "RTM:PNT:00003491",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Barnabé",
                "Longitude": "5.418618",
                "Latitude": "43.303241"
            },
            {
                "id": "RTM:PNT:00003493",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Fourragère",
                "Longitude": "5.4242105",
                "Latitude": "43.303877"
            }
        ],
        "RTM:RTE:9000116RTMR": [
            {
                "id": "RTM:PNT:00003493",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Fourragère",
                "Longitude": "5.4242105",
                "Latitude": "43.303877"
            },
            {
                "id": "RTM:PNT:00003494",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Barnabé",
                "Longitude": "5.4185925",
                "Latitude": "43.303318"
            },
            {
                "id": "RTM:PNT:00003495",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Louis Armand",
                "Longitude": "5.4135575",
                "Latitude": "43.300013"
            },
            {
                "id": "RTM:PNT:00003496",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Blancarde",
                "Longitude": "5.406124",
                "Latitude": "43.29551"
            },
            {
                "id": "RTM:PNT:00002472",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Timone",
                "Longitude": "5.4003885",
                "Latitude": "43.2911725"
            },
            {
                "id": "RTM:PNT:00002468",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Baille",
                "Longitude": "5.3919765",
                "Latitude": "43.2881685"
            },
            {
                "id": "RTM:PNT:00002467",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Castellane",
                "Longitude": "5.384512",
                "Latitude": "43.286195"
            },
            {
                "id": "RTM:PNT:00002301",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Estrangin",
                "Longitude": "5.378027",
                "Latitude": "43.290329"
            },
            {
                "id": "RTM:PNT:00002300",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Vieux-Port",
                "Longitude": "5.3742465",
                "Latitude": "43.2956545"
            },
            {
                "id": "RTM:PNT:00002299",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Colbert",
                "Longitude": "5.374398",
                "Latitude": "43.3002955"
            },
            {
                "id": "RTM:PNT:00002298",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Charles",
                "Longitude": "5.380105",
                "Latitude": "43.30233"
            },
            {
                "id": "RTM:PNT:00002297",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Réformés Canebière",
                "Longitude": "5.3862025",
                "Latitude": "43.300401"
            },
            {
                "id": "RTM:PNT:00002296",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Cinq Avenues Longchamp",
                "Longitude": "5.3961085",
                "Latitude": "43.3040585"
            },
            {
                "id": "RTM:PNT:00002295",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Chartreux",
                "Longitude": "5.401482",
                "Latitude": "43.309106"
            },
            {
                "id": "RTM:PNT:00002294",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Saint-Just",
                "Longitude": "5.4064365",
                "Latitude": "43.3154115"
            },
            {
                "id": "RTM:PNT:00002293",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Malpassé",
                "Longitude": "5.41644",
                "Latitude": "43.3209445"
            },
            {
                "id": "RTM:PNT:00002292",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "Frais Vallon",
                "Longitude": "5.423258",
                "Latitude": "43.325467"
            },
            {
                "id": "RTM:PNT:00002388",
                "sqlilineNumber": "M1",
                "operator": "RTM",
                "lineRef": "RTM:LNE:116",
                "Name": "La Rose",
                "Longitude": "5.4297405",
                "Latitude": "43.333097"
            }
        ]
    }
}
```

## Scrapping priority

You will have to scrappe the most commonly used lines first, which I will give you in a priority list:

### High priority

All metro and tramway lines

### Medium priority

All high availability bus lines (Marked with a B before the number, like B1)

### Low priority

You will treat these a day or two after the other two priorities above

Bus lines:
- 12
- 91
- 17
- 15 & 15S
- 18

## Time elapsed between priorities

Between each priority, you will give a pause time of at least 2 to 4 hours. If I ask you to stop and wait for another day to do them, you stop.
