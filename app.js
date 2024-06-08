const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const bcrypt = require('bcrypt')

let app = express()
app.use(express.json())

let database = null

const initalizeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server started listening to port 3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

initalizeDBAndServer()

//User Register API
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}' ;`
  const dbUser = await database.get(selectUserQuery)

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            )
        ;`

      await database.run(createUserQuery)

      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//User Login API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});


//password change API
app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbuser = await database.get(selectUserQuery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const oldpasswordMatched = await bcrypt.compare(
      oldPassword,
      dbuser.password,
    )
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    if (oldpasswordMatched === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const updateNewPasswordQuery = `
                UPDATE
                    user
                SET
                    password = '${hashedNewPassword}'
                WHERE 
                     username = '${username}'
            ;`
        await database.run(updateNewPasswordQuery)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
