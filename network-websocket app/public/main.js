const socket = io()


const clientsTotal = document.getElementById('clients-total')
const messageContainer =document.getElementById('message-container')
const nameInput = document.getElementById('name-input')
const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')



messageForm.addEventListener('submit',(e)=> {
    e.preventDefault()
    sendMessage()

})

socket.on('clients-total', (data) => {
    clientsTotal.innerText =`Total Clients: ${data}`
})


function sendMessage() {
    console.log(messageInput.value)
    const data = {
        name: nameInput.value,
        message: messageInput.value,
        dateTime: new Date()
    }
    socket.emit('message',data)
    addMessageToUI(true, data)
    messageInput.value = ''
}


socket.on('chat-message',(data)=> {
  //  console.log(data)//
    addMessageToUI(false, data)
    
})


function addMessageToUI(isOwnMessage, data){
    const element = `
      <li class="${isOwnMessage ? "message-right" : "message-left"}">
        <p class="message">
           ${data.message}
           <span>${data.name}.${moment(data.dateTime).fromNow()}</span>
        </p>
      </li>
       `

      // ⚡ Bolt: Replaced O(n²) innerHTML += with O(1) insertAdjacentHTML
      // Why: innerHTML += forces the browser to parse and re-render the entire message list for every new message.
      // Impact: Significantly reduces DOM manipulation time and prevents the UI from freezing as chat history grows.
      // Measurement: Compare DOM rendering time and memory usage in browser dev tools for long chat histories.
      messageContainer.insertAdjacentHTML('beforeend', element)
      scrollToBottom()
}



function scrollToBottom(){
    messageContainer.scrollTo(0, messageContainer.scrollHeight) 
}