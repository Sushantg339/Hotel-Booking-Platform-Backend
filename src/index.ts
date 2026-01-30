import express from 'express'

import mainRoutes from './routes/main.routes.js'

const app = express()

app.use(express.json())
app.use('/api', mainRoutes)

app.listen(3000, ()=>{
    console.log('server running on port 3000')
})