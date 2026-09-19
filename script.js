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
          createdAt
        }
      }
    }
  `

  const data = await queryGraphQL(query, token)

  const user = data.data.user[0]

  let xp = 0
  for(const transaction of user.transactions) {
    if(transaction.type === "xp") {
      xp += transaction.amount
    }
  }

  const recentTransactions = await getRecentTransactions(token)

  const xpTransactions = recentTransactions.filter(transaction => transaction.type === "xp")
  const maxXP = Math.max(...xpTransactions.map(transaction => transaction.amount))
  const dates = xpTransactions.map(transaction => new Date(transaction.createdAt))
  const firstDate = new Date(Math.min(...dates))
  const lastDate = new Date(Math.max(...dates))

  let previousPoint = null
  for (let i = 0; i < xpTransactions.length; i++) {
    previousPoint = drawXPPoint(
      xpTransactions[i],
      i,
      xpTransactions.length,
      maxXP,
      previousPoint,
      firstDate,
      lastDate
    )
  }
  
  document.querySelector("#xp").textContent= `XP: ${xp}`
  document.querySelector("#profile").textContent = user.login
  document.querySelector("#name").textContent = `${user.firstName} ${user.lastName}`
  
  const list = document.querySelector("#transactions")

  for (const transaction of recentTransactions) {
    const item = document.createElement("li")
    item.textContent = `${transaction.type}: ${transaction.amount}`
    list.appendChild(item)
  }
}

async function getRecentTransactions(token) {
  const query = `
    {
      user {
        transactions(limit: 10) {
          id
          amount
          type
          createdAt
        }
      }
    }
  `

  const data = await queryGraphQL(query, token)

  return data.data.user[0].transactions
}

const form = document.querySelector("#login-form")

form.addEventListener("submit", async event => {
  event.preventDefault()

  const username = document.querySelector("#username").value
  const password = document.querySelector("#password").value
  const error = document.querySelector("#error")

  error.textContent = ""

  try {
    const token = await login(username, password)

    if (!token) {
      throw new Error("Invalid username or password")
    }

    sessionStorage.setItem("token", token)

    await getUser()
  } catch (err) {
    error.textContent = "Login failed"
  }
})

document.querySelector("#logout").addEventListener("click", () => {
  sessionStorage.removeItem("token")
  location.reload()
})

function drawXPPoint(transaction, index, total, maxXP, previousPoint, firstDate, lastDate) {
  const chart = document.querySelector("#xp-chart")

  const point = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  )

  const date = new Date(transaction.createdAt)

  const range = lastDate - firstDate
  const x = range === 0
    ? 50
    : 50 + ((date - firstDate) / range) * 500

  const y = 250 - (transaction.amount / maxXP) * 220

  point.setAttribute("cx", x)
  point.setAttribute("cy", y)
  point.setAttribute("r", 5)

  chart.appendChild(point)

  if (previousPoint) {
    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    )

    line.setAttribute("x1", previousPoint.x)
    line.setAttribute("y1", previousPoint.y)
    line.setAttribute("x2", x)
    line.setAttribute("y2", y)
    line.setAttribute("stroke", "black")

    chart.appendChild(line)
  }

  return { x, y }
}
