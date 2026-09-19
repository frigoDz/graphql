const API_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql"
const LOGIN_URL = "https://learn.zone01oujda.ma/api/auth/signin"

async function login(username, password) {
  const credentials = btoa(`${username}:${password}`)

  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`
    }
  })

  return response.json()
}

async function queryGraphQL(query, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ query })
  })

  return response.json()
}

async function getUser() {
  const token = sessionStorage.getItem("token")

  const query = `
    {
      user {
        id
        login
        firstName
        lastName
        transactions {
          id
          amount
          type
        }
      }
    }
  `

  const data = await queryGraphQL(query, token)

  const user = data.data.user[0]

  document.querySelector("#profile").textContent = user.login
  document.querySelector("#name").textContent =
    `${user.firstName} ${user.lastName}`

  console.log(user.transactions)
}

const form = document.querySelector("#login-form")

form.addEventListener("submit", async event => {
  event.preventDefault()

  const username = document.querySelector("#username").value
  const password = document.querySelector("#password").value

  const token = await login(username, password)

  sessionStorage.setItem("token", token)

  getUser()
})
