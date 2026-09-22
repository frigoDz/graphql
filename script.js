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

  for (const transaction of user.transactions) {
    if (transaction.type === "xp") {
      xp += transaction.amount
    }
  }

  const recentTransactions = await getRecentTransactions(token)

  document.querySelector("#profile").textContent = user.login
  document.querySelector("#name").textContent =
    `${user.firstName} ${user.lastName}`
  document.querySelector("#xp").textContent = `XP: ${xp}`

  const list = document.querySelector("#transactions")

  for (const transaction of recentTransactions) {
    const item = document.createElement("li")
    item.textContent = `${transaction.type}: ${transaction.amount}`
    list.appendChild(item)
  }

  drawXPChart(user.transactions)
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

function drawXPLabels(maxXP) {
  const chart = document.querySelector("#xp-chart")

  for (let i = 0; i <= 4; i++) {
    const value = Math.round((maxXP / 4) * i)
    const y = 250 - (i / 4) * 220

    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    )

    label.setAttribute("x", 5)
    label.setAttribute("y", y)
    label.textContent = value

    chart.appendChild(label)
  }
}

function drawDateLabels(firstDate, lastDate) {
  const chart = document.querySelector("#xp-chart")

  const start = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  )

  start.setAttribute("x", 50)
  start.setAttribute("y", 270)
  start.textContent = firstDate.toLocaleDateString()

  chart.appendChild(start)

  const end = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  )

  end.setAttribute("x", 500)
  end.setAttribute("y", 270)
  end.textContent = lastDate.toLocaleDateString()

  chart.appendChild(end)
}

function drawGrid() {
  const chart = document.querySelector("#xp-chart")

  for (let i = 1; i < 4; i++) {
    const y = 250 - (i / 4) * 220

    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    )

    line.setAttribute("x1", 50)
    line.setAttribute("y1", y)
    line.setAttribute("x2", 550)
    line.setAttribute("y2", y)
    line.setAttribute("stroke", "black")
    line.setAttribute("stroke-dasharray", "4")

    chart.appendChild(line)
  }
}

function drawXPChart(transactions) {
  const xpTransactions = transactions
    .filter(transaction => transaction.type === "xp")
    .sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

  if (xpTransactions.length === 0) {
    return
  }

  let totalXP = 0

  const points = xpTransactions.map(transaction => {
    totalXP += transaction.amount

    return {
      ...transaction,
      totalXP
    }
  })

  const maxXP = poinfunction drawXPChart(transactions) {
  const chart = document.querySelector("#xp-chart")

  chart.innerHTML = `
    <text x="250" y="20">XP Over Time</text>

    <line x1="50" y1="250" x2="550" y2="250" stroke="black"></line>
    <line x1="50" y1="30" x2="50" y2="250" stroke="black"></line>
  `

  const xpTransactions = transactions
    .filter(transaction => transaction.type === "xp")
    .sort((a, b) => {
      return new Date(a.createdAt) - new Date(b.createdAt)
    })

  if (xpTransactions.length === 0) {
    return
  }

  let totalXP = 0

  const points = xpTransactions.map(transaction => {
    totalXP += transaction.amount

    return {
      ...transaction,
      totalXP
    }
  })

  const maxXP = points[points.length - 1].totalXP
  drawGrid()
  drawXPLabels(maxXP)

  const dates = points.map(
    transaction => new Date(transaction.createdAt)
  )

  const firstDate = new Date(Math.min(...dates))
  const lastDate = new Date(Math.max(...dates))

  drawDateLabels(firstDate, lastDate)

  let previousPoint = null

  for (let i = 0; i < points.length; i++) {
    previousPoint = drawXPPoint(
      points[i],
      i,
      points.length,
      maxXP,
      previousPoint,
      firstDate,
      lastDate
    )
  }
}

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
