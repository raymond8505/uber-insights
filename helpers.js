/**
 * If a next trip after a hockey game is from a venue to home
 * and that pickup location is within this radius, then it's assumed
 * to be a post game trip from a bar
 */
const barRadiusMetres = 950

function findPostGameTrip(from, to, postGameTrips) {
    return postGameTrips.find(trip => trip.from === from && trip.to === to)
}
async function getDistanceFromGoogle(adr1, adr2) {
    const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${adr2}&origins=${adr1}&units=metric&key=${process.env.GOOGLE_API_KEY}`)
    const data = await res.json()

    return data.rows[0]?.elements[0]?.distance.value
}
async function getDistance(adr1, adr2, postGameTrips) {
    return new Promise(async (res, rej) => {
        const knownTrip = findPostGameTrip(adr1, adr2, postGameTrips)

        if (knownTrip) {
            res(knownTrip.distance)
        }
        else {
            const distance = await getDistanceFromGoogle(adr1, adr2)
            postGameTrips.push({ from: adr1, to: adr2, distance })
            //console.table(postGameTrips)
            res(distance)
        }
    })

}

async function isPickupCloseToVenue(pickupAddress, venueAddress, postGameTrips) {
    const distance = await getDistance(pickupAddress, venueAddress, postGameTrips)
    return distance <= barRadiusMetres
}

module.exports = {
    findPostGameTrip,
    getDistanceFromGoogle,
    getDistance,
    isPickupCloseToVenue
}