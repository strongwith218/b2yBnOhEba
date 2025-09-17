// bot.js
// المتطلبات: npm install discord.js
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function sendMessagesInChannel(channel, messages) {
  for (let i = 0; i < messages.length; i++) {
    try {
      await channel.send(messages[i]);
      console.log(`✔️ أرسلت (${i + 1}/${messages.length}) في #${channel.name}`);
    } catch (err) {
      console.error(`❌ خطأ في #${channel.name}:`, err.message);
      await sleep(config.timings.delayOnError || 5000);
    }
    await sleep(config.timings.delayBetweenMessages || 2000);
  }
}

async function runCycle() {
  console.log("🚀 بدء دورة إرسال جديدة");
  for (const guild of client.guilds.cache.values()) {
    if (config.guildIds.length > 0 && !config.guildIds.includes(guild.id)) {
      console.log(`⏭️ تخطي ${guild.name} (${guild.id})`);
      continue;
    }

    console.log(`🔹 السيرفر: ${guild.name}`);
    const me = guild.members.me;

    for (const channel of guild.channels.cache.values()) {
      if (channel.type !== 0) continue; // 0 = TextChannel
      const perms = channel.permissionsFor(me);
      if (!perms?.has("SendMessages")) {
        console.log(`⛔ لا أقدر أرسل في #${channel.name}`);
        continue;
      }

      console.log(`📨 الإرسال في #${channel.name}`);
      await sendMessagesInChannel(channel, config.messages);
      await sleep(config.timings.delayBetweenChannels || 3000);
    }
  }
  console.log("✅ انتهت الدورة");
}

client.once("ready", async () => {
  console.log(`✅ سجل الدخول كبوت: ${client.user.tag}`);

  let cycleCount = null;
  if (config.repeat.mode !== "infinite") {
    cycleCount = parseInt(config.repeat.mode, 10);
  }

  let current = 0;
  while (true) {
    if (cycleCount !== null && current >= cycleCount) {
      console.log("⏹️ انتهى العدد المحدد من الدورات");
      break;
    }
    current++;
    console.log(`🌀 بدء دورة ${current}${cycleCount ? "/" + cycleCount : ""}`);
    await runCycle();
    console.log(`⏳ انتظار ${config.repeat.delayBetweenCycles}s قبل الدورة التالية`);
    await sleep(config.repeat.delayBetweenCycles * 1000);
  }

  console.log("👋 إغلاق البوت");
  client.destroy();
});

client.login(config.token);
