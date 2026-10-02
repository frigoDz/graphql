const API_URL = "https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql"
const LOGIN_URL = "https://learn.zone01oujda.ma/api/auth/signin"
const loginFormHTML = document.querySelector("#login-form").outerHTML

async function login(usernameOrEmail, password) {
  const credentials = btoa(`${usernameOrEmail}:${password}`)

  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}` },
  })

  if (!response.ok) {
    throw new Error("Invalid username/email or password")
  }

  return response.json()
}

async function queryGraphQL(query, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    const error = new Error("GraphQL request failed")
    error.status = response.status
    throw error
  }

  const result = await response.json()

  if (result.errors) {
    throw new Error(result.errors[0].message)
  }

  return result
}

async function getUser() {
  const token = sessionStorage.getItem("token")

  const query = `
    {
      user {
        login
        firstName
        lastName
        attrs
        createdAt
        auditRatio
        events(where: { eventId: { _eq: 41 } }) {
          level
        }
        transactions(where: { originEventId: { _eq: 41 } }) {
          amount
          type
          createdAt
          object {
            name
          }
        }
      }
    }
  `

  const data = await queryGraphQL(query, token)
  const user = data.data.user[0]

  const xpTransactions = user.transactions.filter((t) => t.type === "xp").sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const totalXP = xpTransactions.reduce((sum, t) => sum + t.amount, 0)
  const skills = {}
  for (const t of user.transactions) {
    if (!t.type.startsWith("skill_")) continue
    const name = t.type.replace("skill_", "")
    if (!skills[name] || t.amount > skills[name]) skills[name] = t.amount
  }

  document.querySelector("#header-username").textContent = user.login
  document.querySelector("#name").textContent =
    `${user.firstName} ${user.lastName}`
  document.querySelector("#login").textContent = user.login
  document.querySelector("#profile-picture").src = user.attrs?.avatarUrl || ""
  document.querySelector("#level").textContent = user.events[0]?.level ?? 0
  document.querySelector("#xp").textContent = `${Math.round(totalXP / 1000)}kb`
  document.querySelector("#audit-ratio").textContent = user.auditRatio.toFixed(1)
  document.querySelector("#member-since").textContent = new Date(user.createdAt,).toLocaleDateString()

  drawXPChart(xpTransactions)
  drawSkillsChart(skills)
  document.querySelector("#login-form")?.remove()
  document.querySelector("#logout").hidden = false
  document.querySelector("#profile-section").hidden = false
}

const PLOT = { left: 55, right: 545, top: 40, bottom: 280 }

function drawGrid(chart, currentXP, scaleMax) {
  for (let i = 0; i <= 4; i++) {
    const value = (scaleMax / 4) * i
    const y = PLOT.bottom - (value / scaleMax) * (PLOT.bottom - PLOT.top)

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
    line.setAttribute("x1", 50)
    line.setAttribute("y1", y)
    line.setAttribute("x2", 550)
    line.setAttribute("y2", y)
    line.setAttribute("stroke", "#999")
    chart.appendChild(line)

    const label = document.createElementNS("http://www.w3.org/2000/svg","text",)
    label.setAttribute("x", 45)
    label.setAttribute("y", y + 4)
    label.setAttribute("text-anchor", "end")
    label.setAttribute("font-size", 11)
    label.textContent = `${Math.round(value / 1000)}kb`
    chart.appendChild(label)
  }
}

function drawXPChart(xpTransactions) {
  const chart = document.querySelector("#xp-chart")

  chart.innerHTML = `
    <text x="280" y="20" font-weight="bold">XP over time</text>
    <line x1="50" y1="280" x2="550" y2="280" stroke="black"></line>
    <line x1="50" y1="30" x2="50" y2="280" stroke="black"></line>
  `

  if (xpTransactions.length === 0) return

  let running = 0
  const points = xpTransactions
    .map((t) => {
      running += t.amount
      return {
        total: running,
        amount: Math.round(t.amount / 1000),
        name: t.object?.name || "unknown project",
      }
    })
  
  const currentXP = points[points.length - 1].total
  const scaleMax = currentXP

  drawGrid(chart, currentXP, scaleMax)

  let prev = null
  for (const [i, point] of points.entries()) {
    const x = PLOT.left + (i / Math.max(points.length - 1, 1)) * (PLOT.right - PLOT.left)
    const y = PLOT.bottom - (point.total / scaleMax) * (PLOT.bottom - PLOT.top)
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle",)
    circle.setAttribute("cx", x)
    circle.setAttribute("cy", y)
    circle.setAttribute("r", 4)
    circle.setAttribute("fill", "#c00")

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title",)
    title.textContent = `${point.name} (+${point.amount} kB)`
    circle.appendChild(title)
    chart.appendChild(circle)

    const core = document.createElementNS("http://www.w3.org/2000/svg", "circle",)
    core.setAttribute("cx", x)
    core.setAttribute("cy", y)
    core.setAttribute("r", 2)
    core.setAttribute("fill", "black")
    core.setAttribute("pointer-events", "none")
    chart.appendChild(core)

    if (prev) {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line",)
      line.setAttribute("x1", prev.x)
      line.setAttribute("y1", prev.y)
      line.setAttribute("x2", x)
      line.setAttribute("y2", y)
      line.setAttribute("stroke", "black")
      chart.appendChild(line)
    }

    prev = { x, y }
  }
}

function drawSkillsChart(skills) {
  const chart = document.querySelector("#skills-chart")
  const names = Object.keys(skills).sort((a, b) => skills[b] - skills[a])
  const width = Math.max(600, 70 * names.length)
  chart.setAttribute("viewBox", `0 0 ${width} 450`)
  chart.setAttribute("width", width)
  chart.setAttribute("height", 500)
  chart.innerHTML = `<text x="${width / 2}" y="20" font-weight="bold" text-anchor="middle">Skills</text>`

  if (names.length === 0) return

  const top = 40
  const bottom = 400
  const maxAmount = Math.max(...names.map(n => skills[n]))

  names.forEach((name, i) => {
    const amount = skills[name]
    const x = 35 + i * (width - 60) / names.length
    const barWidth = Math.min(40, (width - 60) / names.length - 10)
    const barHeight = (amount / maxAmount) * (bottom - top)
    const y = bottom - barHeight

    const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    bar.setAttribute("x", x)
    bar.setAttribute("y", y)
    bar.setAttribute("width", barWidth)
    bar.setAttribute("height", barHeight)
    bar.setAttribute("fill", "green")
    bar.setAttribute("stroke", "black")
    chart.appendChild(bar)

    const value = document.createElementNS("http://www.w3.org/2000/svg", "text")
    value.setAttribute("x", x + barWidth / 2)
    value.setAttribute("y", y - 6)
    value.setAttribute("text-anchor", "middle")
    value.textContent = amount
    chart.appendChild(value)
    const label = document.createElementNS("http://www.w3.org/2000/svg","text",)
    const labelX = x + barWidth / 2
    const labelY = bottom + 20
    label.setAttribute("x", labelX)
    label.setAttribute("y", labelY)
    label.setAttribute("text-anchor", "start")
    label.setAttribute("font-size", "12")
    label.setAttribute("font-weight", "bold")
    label.setAttribute("transform",`rotate(45 ${labelX} ${labelY})`)
    label.textContent = name
    chart.appendChild(label)

  })
}
function attachLoginForm() {
  document.querySelector("#login-form").addEventListener("submit", async event => {
    event.preventDefault()

    const username = document.querySelector("#username").value
    const password = document.querySelector("#password").value
    const error = document.querySelector("#error")
    error.textContent = ""

    try {
      const token = await login(username, password)
      if (!token) throw new Error("Login failed")

      sessionStorage.setItem("token", token)
      await getUser()
    } catch (err) {
      error.textContent = err.message
    } 
  })
}

attachLoginForm()
document.querySelector("#logout").addEventListener("click", () => {
  sessionStorage.removeItem("token")
  location.reload()
})

const savedToken = sessionStorage.getItem("token")
if (savedToken) {
  document.querySelector("#login-form").remove()

  getUser().catch(err => {
    if (err.status === 401) sessionStorage.removeItem("token")

    document.querySelector("#profile-section").insertAdjacentHTML("beforebegin", loginFormHTML)
    attachLoginForm()
    document.querySelector("#error").textContent = err.message
  })
}
