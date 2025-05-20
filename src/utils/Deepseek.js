export async function sendToDeepSeek(userInput) {
    if (!userInput) return { error: "Empty input" };
  
    try {
      const res = await fetch("https://fir-truth-zinc.glitch.me/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userInput })
      });
  
      const data = await res.json();
  
      if (data.choices && data.choices[0]) {
        return { response: data.choices[0].message.content };
      } else {
        return { error: "Malformed response from DeepSeek" };
      }
    } catch (err) {
      console.error("Error sending to DeepSeek:", err);
      return { error: "Network or server error" };
    }
  }
  