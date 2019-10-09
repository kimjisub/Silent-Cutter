const sqlite = require('sqlite')
const SQL = require('sql-template-strings')
const dbPromise = sqlite.open('./cache.db', {
	Promise
})
let db

init()

async function init() {
	db = await dbPromise
	await db.all(`CREATE TABLE IF NOT EXISTS cache (
        key Varchar,
        data Varchar
    )`)
}


module.exports.get = (key) => {
	return new Promise((resolve, reject) => {
		db.get(SQL `SELECT * FROM cache WHERE key = ${key}`)
			.then((result) => resolve(result))
			.catch(e => reject(e))
	})
}
module.exports.set = (key, data) => {
	return new Promise((resolve, reject) => {
		db.run(SQL `INSERT INTO cache (key, data) VALUES (${key}, ${data})`)
			.then((result) => resolve(result))
			.catch(e => reject(e))
	})
}
module.exports.getOrSet = (key, cb) => {
	return new Promise((resolve, reject) => {
		module.exports.get(key)
			.then(async row => {
				if (!row) {
					const data = await cb()
					await module.exports.set(key, data)
					resolve(data)
				} else {
					const data = row.data
					resolve(data)
				}
			})
			.catch(e => reject(e))
		
	})
}