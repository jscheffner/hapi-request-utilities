'use strict'

const Lab = require('@hapi/lab')
const Hapi = require('@hapi/hapi')
const { expect } = require('@hapi/code')

let server

const { experiment, it, beforeEach } = (exports.lab = Lab.script())

experiment('hapi-request-utilities plugin', () => {
  beforeEach(async () => {
    server = new Hapi.Server()
    await server.initialize()

    await server.register({
      plugin: require('../lib/index')
    })

    server.auth.scheme('succeeding', () => {
      return {
        authenticate (request, h) {
          if (request.auth.mode === 'try') {
            return h.unauthenticated(new Error('missing credentials'))
          }

          return h.authenticated({ credentials: { name: 'Marcus' } })
        }
      }
    })

    server.auth.strategy('marcus', 'succeeding')
  })

  it('tests the request.all decoration', async () => {
    server.route({
      path: '/',
      method: 'POST',
      handler: request => {
        return request.all()
      }
    })

    const request = {
      url: '/?name=marcus',
      method: 'POST',
      payload: {
        isHapiPassionate: 'oh-yeah'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({
      name: 'marcus',
      isHapiPassionate: 'oh-yeah'
    })
  })

  it('tests the request.all decoration and query takes priority', async () => {
    server.route({
      path: '/',
      method: 'POST',
      handler: request => {
        return request.all()
      }
    })

    const request = {
      url: '/?name=marcus',
      method: 'POST',
      payload: {
        isHapiPassionate: 'oh-yeah',
        name: 'other Name'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({
      name: 'marcus',
      isHapiPassionate: 'oh-yeah'
    })
  })

  it('tests the request.only decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.only(['name'])
      }
    })

    const request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result.name).to.equal('marcus')
  })

  it('tests the request.only decoration with string as key (not array of strings)', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.only('name')
      }
    })

    const request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result.name).to.equal('marcus')
  })

  it('tests the request.has decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.has(['name', 'developer'])
      }
    })

    let request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const { result, statusCode } = await server.inject(request)
    expect(statusCode).to.equal(200)
    expect(result).to.equal(false)
  })

  it('tests the request.has decoration with string as key (not array of strings)', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.has('name')
      }
    })

    let request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const { result, statusCode } = await server.inject(request)
    expect(statusCode).to.equal(200)
    expect(result).to.equal(false)
  })

  it('tests the request.filled decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.filled(['name', 'developer'])
      }
    })

    let request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      payload: {
        name: 'Marcus',
        developer: ''
      }
    }

    const { result, statusCode } = await server.inject(request)
    expect(statusCode).to.equal(200)
    expect(result).to.equal(false)
  })

  it('tests the request.filled decoration with string as key (not array of strings)', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.filled('name')
      }
    })

    let request = {
      url: '/?name=marcus&developer=hapi',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/?name=',
      method: 'GET',
      payload: {
        isHapiPassionate: true
      }
    }

    const { result, statusCode } = await server.inject(request)
    expect(statusCode).to.equal(200)
    expect(result).to.equal(false)
  })

  it('tests the request.except decoration', async () => {
    server.route({
      path: '/',
      method: 'POST',
      handler: request => {
        return request.except(['name'])
      }
    })

    const request = {
      url: '/?name=marcus&developer=hapi',
      method: 'POST',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({
      developer: 'hapi',
      isHapiPassionate: true
    })
  })

  it('tests the request.except decoration with string as key (not array of strings)', async () => {
    server.route({
      path: '/',
      method: 'POST',
      handler: request => {
        return request.except('isHapiPassionate')
      }
    })

    const request = {
      url: '/?name=marcus&developer=hapi',
      method: 'POST',
      payload: {
        isHapiPassionate: true
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({
      name: 'marcus',
      developer: 'hapi'
    })
  })

  it('test the request.header decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.header('x-data')
      }
    })

    const request = {
      url: '/',
      method: 'GET',
      headers: {
        'X-Data': 'hapi-request-utilities'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal('hapi-request-utilities')
  })

  it('test the request.hasHeader decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.hasHeader('x-data')
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        'X-Data': 'hapi-request-utilities'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)
  })

  it('test the request.isJson decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.isJson()
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        'content-type': 'application/json'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)
  })

  it('test the request.wantsJson decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.wantsJson()
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        accept: 'application/json'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)
  })

  it('test the request.wantsHtml decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.wantsHtml()
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        accept: 'text/html'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)
  })

  it('test the request.cookie decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.cookie('name') || 'empty'
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        cookie: 'name=Marcus'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal('Marcus')

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal('empty')
  })

  it('test the request.cookies decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.cookies()
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        cookie: 'name=Marcus; token=123'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({
      name: 'Marcus',
      token: '123'
    })

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({})
  })

  it('test the request.hasCookie decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => {
        return request.hasCookie('name')
      }
    })

    let request = {
      url: '/',
      method: 'GET',
      headers: {
        cookie: 'name=Marcus'
      }
    }

    let response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)

    request = {
      url: '/',
      method: 'GET',
      headers: { }
    }

    response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)
  })

  it('test request decoration for a present request.bearerToken', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => request.bearerToken()
    })

    const request = {
      url: '/',
      method: 'GET',
      headers: {
        Authorization: 'Bearer 1234'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal('1234')
  })

  it('test request decoration for unavailable request.bearerToken', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => request.bearerToken() || 'no-token'
    })

    const request = {
      url: '/',
      method: 'GET',
      headers: {
        Authorization: 'API-Key 1234'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.equal('no-token')
  })

  it('does not return the user credentials', async () => {
    server.route({
      path: '/',
      method: 'GET',
      handler: request => request.user || {}
    })

    const request = {
      url: '/',
      method: 'GET'
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({ })
  })

  it('has access to the user credentials in extension points after auth', async () => {
    server.route({
      path: '/',
      method: 'GET',
      options: {
        auth: {
          strategy: 'marcus',
          mode: 'required'
        },
        handler: request => request.user || {}
      }
    })

    server.ext('onPreAuth', (request, h) => {
      expect(request.user).to.not.exist()
      return h.continue
    })

    server.ext('onPostAuth', (request, h) => {
      expect(request.user).to.equal({ name: 'Marcus' })
      return h.continue
    })

    server.ext('onPreResponse', (request, h) => {
      expect(request.user).to.equal({ name: 'Marcus' })
      return h.continue
    })

    const request = {
      url: '/',
      method: 'GET'
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal({ name: 'Marcus' })
  })

  it('tests the request.isAuthenticated() decoration', async () => {
    server.route({
      path: '/',
      method: 'GET',
      options: {
        auth: {
          strategy: 'marcus',
          mode: 'try'
        },
        handler: request => {
          return request.isAuthenticated()
        }
      }
    })

    const unauthenticatedRequest = {
      url: '/',
      method: 'GET'
    }

    let response = await server.inject(unauthenticatedRequest)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(false)

    const authenticatedRequest = {
      url: '/',
      method: 'GET',
      auth: { credentials: { name: 'Marcus' }, strategy: 'default' }
    }

    response = await server.inject(authenticatedRequest)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(true)
  })

  it('request.input', async () => {
    server.route({
      path: '/',
      method: 'POST',
      handler: request => request.input('_token') || '54321'
    })

    const request = {
      url: '/',
      method: 'POST',
      payload: {
        _token: '12345'
      }
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal('12345')
  })

  it('request.root', async () => {
    const url = 'http://localhost/users?name=Marcus'

    server.ext('onRequest', (request, h) => {
      request.setUrl(url)

      return h.continue
    })

    server.route({
      path: '/users',
      method: 'GET',
      handler: request => request.root()
    })

    const request = {
      url: '/users',
      method: 'GET'
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal('http://localhost')
  })

  it('request.uri', async () => {
    const url = 'https://localhost/users?name=Marcus#hashtag'

    server.ext('onRequest', (request, h) => {
      request.setUrl(url)

      return h.continue
    })

    server.route({
      path: '/users',
      method: 'GET',
      handler: request => request.uri()
    })

    const request = {
      url: '/users?name=Marcus',
      method: 'GET'
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal('https://localhost/users')
  })

  it('request.fullUrl', async () => {
    const url = 'http://localhost/users?name=Marcus#hashtag'

    server.ext('onRequest', (request, h) => {
      request.setUrl(url)

      return h.continue
    })

    server.route({
      path: '/users',
      method: 'GET',
      handler: request => request.fullUri() // request.fullUri is an alias for request.fullUrl -> testing both method calls here
    })

    const request = {
      url: '/users?name=Marcus#hashtag',
      method: 'GET'
    }

    const response = await server.inject(request)
    expect(response.statusCode).to.equal(200)
    expect(response.result).to.equal(url)
  })
})
