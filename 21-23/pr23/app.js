const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (req, res) => {
	res.json({
		port: PORT,
		message: "Hello World",
	})
})

app.listen(PORT, () => {
	console.log(`Сервер запущен на порте: ${PORT}`)
})