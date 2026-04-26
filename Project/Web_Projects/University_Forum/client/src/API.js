const URL = 'http://localhost:3001/api'

async function getJson(httpResponsePromise) {
  const response = await httpResponsePromise
  if (response.ok) {
    const json = await response.json()
    return json
  } else {
    const errMessage = await response.json()
    throw errMessage
  }
}

function getUser(credentials) {
  return getJson(fetch(URL + '/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  }))
}

function getUserInfo() {
  return getJson(fetch(URL + '/sessions/current', {
    credentials: 'include',
  }))
}

function logOut() {
  return getJson(fetch(URL + '/sessions/current', {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  }))
}

function verifyTotp(token) {
  return getJson(fetch(URL + '/login-totp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ code: token }),
  }))
}

function getAllPosts() {
  return getJson(fetch(URL + '/posts'))
}

function getPost(id) {
  return getJson(fetch(URL + `/posts/${id}`))
}

function addPost(post) {
  return getJson(fetch(URL + '/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(post),
  }))
}

function updatePost(id, post) {
  return getJson(fetch(URL + `/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(post),
  }))
}

function deletePost(id) {
  return getJson(fetch(URL + `/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

function getComments(postId) {
  return getJson(fetch(URL + `/posts/${postId}/comments`))
}

function addComment(postId, comment) {
  return getJson(fetch(URL + `/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(comment),
  }))
}

function updateComment(id, comment) {
  return getJson(fetch(URL + `/comments/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(comment),
  }))
}

function deleteComment(id) {
  return getJson(fetch(URL + `/comments/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }))
}

function toggleInteresting(commentId) {
  return getJson(fetch(URL + `/comments/${commentId}/interesting`, {
    method: 'POST',
    credentials: 'include',
  }))
}

function createUser(username, password) {
  return getJson(fetch(URL + '/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  }))
}

const API = {
  logIn: getUser,
  logOut,
  getUserInfo,
  verifyTotp,
  getAllPosts,
  getPost,
  addPost,
  updatePost,
  deletePost,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  toggleInteresting,
  createUser
}

export default API
