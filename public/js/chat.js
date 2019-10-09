const socket = io()

//elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormBtn = messageForm.querySelector('button')
const locationBtn = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoScroll = () =>{
    // get new message element
    const newMessage = messages.lastElementChild

    //get height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    //get visible height

    const visibleHeight = messages.offsetHeight
    
    //height of messages container

    const containerHeight = messages.scrollHeight

    //how far have I scrolled

    const scrollOffset = messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('locationMessage', (url) => {
    const html = Mustache.render(locationTemplate, {
        username: url.username,
        url: url.url,
        createdAt: moment(url.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    //disable form
    messageFormBtn.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        //enable form
        messageFormBtn.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('message delivered')
    })
    e.preventDefault()
})

locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation not supported")
    }
    locationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        const geolocation = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }
        socket.emit('sendLocation', geolocation, () => {
            locationBtn.removeAttribute('disabled')
            console.log('Delivered!')
        })
    })

})

socket.emit('join', { username, room }, (error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})