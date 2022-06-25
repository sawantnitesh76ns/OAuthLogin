const express = require("express");
const app = express();
const cors = require('cors')
const mongoose = require('mongoose');
const User = require('./models/user.model')
const OpenIdUser = require('./models/openId_user_model')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.REACT_APP_GOOGLE_CLIENT_ID)


app.use(cors());

// Tell express that the body of a request will be JSON
app.use(express.json());

//Connect mongo db
mongoose.connect('mongodb+srv://nitesh123:nitesh123@userloginauthentication.quuylc3.mongodb.net/?retryWrites=true&w=majority')


app.post('/api/v1.0/register', async (req, res) => {
    console.log(req.body)
    try {
        const encryptPassword = await bcrypt.hash(req.body.password, 10)
        console.log(encryptPassword)
        await User.create({
            name: req.body.name,
            email: req.body.email,
            password: encryptPassword
        })
        res.json({ status: 'ok' })
    } catch (error) {
        res.json({ status: 'error', error: 'Duplicate Email' })
    }
})

app.post('/api/v1.0/login', async (req, res) => {
    console.log(req.body)
    const user = await User.findOne({ email: req.body.email });

    if (!user) { return res.json({ status: 'error', error: 'Invalid login' }) }

    const isPasswordValid = await bcrypt.compare(req.body.password, user.password)

    if (isPasswordValid) {
        const token = jwt.sign({
            name: user.name,
            email: user.email
        }, 'secret123')
        res.json({ status: 'ok', user: token })
    } else {
        res.json({ status: 'error', user: false })
    }

})

app.get('/api/v1.0/quote', async (req, res) => {

    const token = req.header('x-access-token')
    try {
        const decoded = jwt.verify(token, 'secret123')
        const email = decoded.email;
        const user = await User.findOne({ email: email })

        console.log(email)
        if (!user) {
            return res.json({ status: 'ok', quote: "" })
        }
        return res.json({ status: 'ok', quote: user.quote })

    } catch (error) {
        console.log(error)
        res.json({ status: 'error ', error: 'invalid token' })

    }


})

app.post('/api/v1.0/quote', async (req, res) => {

    const token = req.header('x-access-token')
    try {
        const decoded = jwt.verify(token, 'secret123')
        const email = decoded.email;
        await User.updateOne({ email: email }, { $set: { quote: req.body.quote } })

        return res.json({ status: 'ok' })

    } catch (error) {
        console.log(error)
        res.json({ status: 'error ', error: 'invalid token' })

    }


})

app.post('/api/v1.0/auth/google', async (req, res) => {

    try {
        const { token } = req.body

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.REACT_APP_GOOGLE_CLIENT_ID
        });

        const { name, email } = ticket.getPayload();

        const user = await User.findOne({
            email: email
        })

        if (user) {
            var buf1 = Buffer.from(token)
            var buf2 = Buffer.from(user.password)
            const isUserAuthenticated = Buffer.compare(buf1, buf2)
            if (isUserAuthenticated) {
                const jwtToken = jwt.sign({
                    name: name,
                    email: email
                }, 'secret123')
                res.json({ status: 'ok', user: jwtToken })
            } else {
                res.json({ status: 'error', user: false })
            }

        }
        else {

            await User.create({
                email: email,
                name: name,
                password: token
            })
            const jwtToken = jwt.sign({
                name: name,
                email: email
            }, 'secret123')
            console.log()
            res.json({ status: 'ok', user: jwtToken })
        }
    } catch (error) {
        return res.json({ status: 'error', error: "Unable to login using google" })
    }



})

app.listen(8888, () => {
    console.log("Server Started on port 8888");
})
