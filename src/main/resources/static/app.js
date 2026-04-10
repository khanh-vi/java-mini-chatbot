const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const scrollLatestBtn = document.getElementById("scroll-latest-btn");
const promptChips = document.querySelectorAll(".prompt-chip");

let isLoading = false;

function createMessageElement(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message");

    if (role === "user") {
        messageDiv.classList.add("user-message");
    } else {
        messageDiv.classList.add("assistant-message");
    }

    const roleDiv = document.createElement("div");
    roleDiv.classList.add("message-role");
    roleDiv.textContent = role === "user" ? "You" : "AI";

    const textDiv = document.createElement("div");
    textDiv.classList.add("message-text");

    if (role === "assistant") {
        textDiv.innerHTML = marked.parse(text);
    } else {
        textDiv.textContent = text;
    }

    messageDiv.appendChild(roleDiv);
    messageDiv.appendChild(textDiv);

    return messageDiv;
}

function createThinkingElement() {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", "assistant-message");
    messageDiv.id = "loading-message";

    const roleDiv = document.createElement("div");
    roleDiv.classList.add("message-role");
    roleDiv.textContent = "AI";

    const textDiv = document.createElement("div");
    textDiv.classList.add("message-text", "thinking-wrap");
    textDiv.innerHTML = `
        <span class="thinking-label">Thinking</span>
        <span class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;

    messageDiv.appendChild(roleDiv);
    messageDiv.appendChild(textDiv);

    return messageDiv;
}

function renderMathIfNeeded(targetElement) {
    if (window.MathJax) {
        return MathJax.typesetPromise([targetElement]).catch(err => {
            console.log(err);
        });
    }
    return Promise.resolve();
}

function isNearBottom() {
    const threshold = 80;
    return (
        chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight
        < threshold
    );
}

function scrollToBottom(smooth = true) {
    chatMessages.scrollTo({
        top: chatMessages.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
    });
}

function scrollToMessageStart(messageElement) {
    requestAnimationFrame(() => {
        messageElement.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

function updateScrollLatestButton() {
    if (isNearBottom()) {
        scrollLatestBtn.classList.remove("show");
    } else {
        scrollLatestBtn.classList.add("show");
    }
}

function addMessage(role, text, scrollMode = "bottom") {
    const messageElement = createMessageElement(role, text);
    chatMessages.appendChild(messageElement);

    const textElement = messageElement.querySelector(".message-text");

    if (role === "assistant") {
        renderMathIfNeeded(textElement).then(() => {
            if (scrollMode === "start") {
                scrollToMessageStart(messageElement);
            } else {
                scrollToBottom();
            }
            updateScrollLatestButton();
        });
    } else {
        if (scrollMode === "start") {
            scrollToMessageStart(messageElement);
        } else {
            scrollToBottom();
        }
        updateScrollLatestButton();
    }

    return messageElement;
}

function setLoadingState(loading) {
    isLoading = loading;
    sendBtn.disabled = loading;
    userInput.disabled = loading;
    sendBtn.textContent = loading ? "Sending..." : "Send";
}

function clearChat() {
    chatMessages.innerHTML = `
        <div class="message assistant-message">
            <div class="message-role">AI</div>
            <div class="message-text">
                Xin chào! Tôi là trợ lý AI. Hãy hỏi tôi bất kỳ điều gì.
            </div>
        </div>
    `;
    userInput.value = "";
    userInput.focus();
    scrollToBottom(false);
    updateScrollLatestButton();
}

function fillInput(text) {
    userInput.value = text;
    userInput.focus();
    userInput.setSelectionRange(userInput.value.length, userInput.value.length);
}

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message || isLoading) return;

    addMessage("user", message, "bottom");
    userInput.value = "";
    setLoadingState(true);

    const loadingMessage = createThinkingElement();
    chatMessages.appendChild(loadingMessage);
    scrollToBottom();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        });

        const loadingElement = document.getElementById("loading-message");
        if (loadingElement) loadingElement.remove();

        if (!response.ok) {
            throw new Error("Server returned an error.");
        }

        const data = await response.json();

        addMessage(
            "assistant",
            data.reply || "Không nhận được phản hồi.",
            "start"
        );
    } catch (error) {
        const loadingElement = document.getElementById("loading-message");
        if (loadingElement) loadingElement.remove();

        console.error("Error while sending message:", error);
        addMessage("assistant", "Đã có lỗi xảy ra. Vui lòng thử lại.", "start");
    } finally {
        setLoadingState(false);
        userInput.focus();
    }
}

sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

newChatBtn.addEventListener("click", clearChat);

promptChips.forEach(chip => {
    chip.addEventListener("click", () => {
        const text = chip.dataset.fill || chip.textContent.trim();
        fillInput(text);
    });
});

scrollLatestBtn.addEventListener("click", () => {
    scrollToBottom();
});

chatMessages.addEventListener("scroll", updateScrollLatestButton);

window.addEventListener("load", function () {
    userInput.focus();
    updateScrollLatestButton();
});