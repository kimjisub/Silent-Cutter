const sqlite = require('sqlite')
const SQL = require('sql-template-strings')
const dbPromise = sqlite.open('./cache.db', { Promise })

init()

async function init(){
    const db = await dbPromise
    await db.all(`CREATE TABLE IF NOT EXISTS cache (
        key Varchar,
        data Varchar
    )`)
}


module.exports.get = (key) => {
    return new Promise(async (resolve, reject) => {
        const db = await dbPromise
		const result = await db.get(SQL`SELECT * FROM cache WHERE key = ${key}`)
		resolve(result)
    })
}
module.exports.set = (key, data) => {
    return new Promise(async (resolve, reject) => {
        const db = await dbPromise
		await db.run(SQL`INSERT INTO cache (key, data) VALUES (${key}, ${data})`)
		resolve()
    })
}
module.exports.getOrSet = (key, cb) => {
    return new Promise(async (resolve, reject) => {
		const row = await module.exports.get(key)
		if(!row){
			const data = await cb()
			await module.exports.set(key, data)
			resolve(data)
		}else{
			const data = row.data
			resolve(data)
		}
    })
}