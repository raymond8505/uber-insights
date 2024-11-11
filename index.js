
(async function () {
    require('dotenv').config()
    const fs = require('fs')
    const { parse } = require('node-html-parser')
    const path = process.env.RECORDS_FILE_PATH
    const file = fs.readFileSync(path, 'utf8')
    const postGameTripsFilePath = './post-game-trips.json'
    const {
        isPickupCloseToVenue
    } = require('./helpers')

    try {
        fs.readFileSync(postGameTripsFilePath, 'utf8')
    }
    catch (e) {
        fs.writeFileSync(postGameTripsFilePath, '[]')
    }

    /**
     * A post game trip is the next trip after a hockey game whose
     * pickup location is within a certain radius of a venue
     */
    const postGameTrips = JSON.parse(fs.readFileSync(postGameTripsFilePath, 'utf8'))

    const rows = parse(file).querySelectorAll('[role="row"]')
    const allTripsRaw = []

    const home = require('./home.json')

    const startDate = new Date('2024-01-01T00:00:00.000Z')

    const hockeyVenues = require('./venues.json')

    const sanitize = (str) => str.replace(/\n[ ]{2,}/g, '')

    const toPrice = (str) => Number(str.replace('CA$', ''))
    rows.forEach((row, i) => {
        if (i === 0) return

        const cells = row.querySelectorAll('[role="gridcell"]')
        const dateCell = cells[0]
        const priceCell = cells[1]
        const fromCell = cells[5]
        const toCell = cells[6]

        allTripsRaw.push({
            date: new Date(`${dateCell.querySelector('div > div:first-child').innerText} ${dateCell.querySelector('div > div:last-child').innerText}  GMT+000`),
            price: toPrice(sanitize(priceCell.innerText)),
            from: sanitize(fromCell.innerText),
            to: sanitize(toCell.innerText)
        })
    })

    const hockeyTrips = []

    const allTrips = allTripsRaw
        .filter(trip => trip.from !== '')
        // .filter((trip, index, arr) => arr.findIndex(t => t.date.getTime() === trip.date.getTime()) === index) // remove duplicates
        .sort((a, b) => a.date.getTime() < b.date.getTime() ? -1 : 1) // sort by date
    // .filter(trip => trip.date.getTime() >= startDate.getTime()) // filter by start date

    /**
     * trips in here are the next trip after a hockey game
     * that originate from outside the bar radius
     * assumption is got a ride home from the game
     */
    const unknownReturn = []

    for (let i = 0; i < allTrips.length; i++) {

        const currentTrip = allTrips[i]

        if (hockeyVenues.includes(currentTrip.to)) {
            hockeyTrips.push(currentTrip)

            const nextTrip = allTrips[i + 1]

            if (home.includes(nextTrip.to)) {
                // went straight home
                if (hockeyVenues.includes(nextTrip.from)) {

                    hockeyTrips.push(nextTrip)
                }
                else if (await isPickupCloseToVenue(currentTrip.to, nextTrip.from, postGameTrips)) {
                    // went to a bar
                    hockeyTrips.push(nextTrip)
                }
                else {
                    // next trip is unknown, likely got a ride.
                    unknownReturn.push(nextTrip)
                }
            }
        }
    }

    fs.writeFileSync(postGameTripsFilePath, JSON.stringify(postGameTrips))

    const getTripsTotal = (trips) => trips.reduce((acc, { price }) => acc + price, 0)
    const toMoney = (num) => Number(num.toFixed(2))

    const perVenue = hockeyVenues.map((venue) => {
        const venueTotal = { venue, total: 0, avg: 0 }
        const venueTrips = hockeyTrips.filter(({ to, from }) => {
            return to === venue || from === venue
        })

        venueTotal.total = toMoney(getTripsTotal(venueTrips))
        venueTotal.avg = toMoney(venueTotal.total / venueTrips.length)
        venueTotal.trips = venueTrips.length

        return venueTotal
    })

    //console.log('hockey trips', hockeyTrips)
    console.table(perVenue)

    const total = toMoney(getTripsTotal(hockeyTrips))
    const avgPerTrip = toMoney(getTripsTotal(hockeyTrips) / hockeyTrips.length)

    console.log('total', total)
    console.log('avg cost per trip', avgPerTrip)

    console.log('avg cost per month', toMoney(total / 24))

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const months = {}
    let monthsTotal = 0
    hockeyTrips.forEach(trip => {
        const month = `${monthNames[trip.date.getMonth()]} ${trip.date.getFullYear()}`
        if (!months[month]) {
            months[month] = 0
        }

        months[month] += 1
        monthsTotal += 1
    })
    const avgTripsPerMonth = Math.round(monthsTotal / Object.keys(months).length)
    console.log('avg trips per month (rounded)', avgTripsPerMonth)
    console.log('avg trips per month x avg cost per month', toMoney(avgTripsPerMonth * avgPerTrip))
    console.table(months)
})()