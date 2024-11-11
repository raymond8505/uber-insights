## What

Parses my Uber ride history to find useful budgeting info about my trips to and from hockey

## How

1. Create an .ENV in root dir and add the variables below
1. create json files in root dir `home.json` `venues.json` see below for details
1. Go to [your trips](https://myprivacy.uber.com/privacy/exploreyourdata/trips) in your Uber account
2. keep scrolling to reveal all your trips
3. inspect the html and copy the wrapping div for the whole table
4. paste table html into a new html file in records dir
5. set `RECORDS_FILE_PATH` env var to that file path

## ENV Vars

```
# A google API key with permissions for the distance matrix
GOOGLE_API_KEY

# if the next trip after a trip TO a venue is taken from within this radius
# it's assumed that I went to a bar after the game and left from there
# measured in metres
BAR_RADIUS

# path to the trips records html file copied from uber
RECORDS_FILE_PATH

# filter rides after a certain date. Uber's records go back 2 years, set it accordingly if you want everything
# format is a full datetime string with timezone eg 2022-10-01T00:00:00.000Z
START_DATE
```

## JSON Files

Both files are an array of strings.

These contain arrays of addresses. Uber doesn't always log the same exact address for pickup or drop off. Seemingly for a number of reasons- with drop off it seems to log where you were dropped of, not what you put into the app for your destination. Same with pickup.

With this in mind you'll need to look through your records for all the addresses near your known pickup and dropoff locations to be able to track things accurately.

