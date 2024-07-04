# 🔍 Lazy Developer Domain Checker 🌐

Are you tired of manually checking domain availability like some kind of digital archaeologist? Do you find yourself falling asleep while typing domain names into WHOIS lookups? Well, wake up and smell the domains ☕, because the Lazy Developer Domain Checker is here to save your day (and your sanity)!

## 🎉 Features

- Checks domains faster than you can say "Why is every good domain name taken?"
- Searches through domain names deeper than your imposter syndrome
- Works with .com and .net domains (because who needs .org anyway?)
- Comes with a retry mechanism for when the internet decides to take a coffee break

## 🛠 Installation

1. Clone this repo (or download it, we don't judge)
2. Make sure you have Node.js and TypeScript installed (if not, how are you even a developer? 🤔)
3. Run `pnpm install` (we know, we know, but even lazy developers need dependencies)

## 🚀 Usage

### Step 1: Navigate to the Script Directory

First things first, let's make sure you're in the right place:

1. Open your command prompt or terminal (no admin powers needed, we're not installing fonts here)
2. Navigate to the directory containing `src/index.ts`

```bash
cd path/to/lazy-domain-checker
```

Replace `path/to/lazy-domain-checker` with the actual path where you cloned or downloaded the repo.

### Step 2: Run the Script

Now that you're in the right spot, let's make some magic happen!

```bash
pnpm start
```

This will compile the TypeScript and run the script. Magic! ✨

## 🚨 Troubleshooting

### "Module not found" Error

If you see an error like this:

```
Error: Cannot find module 'net'
```

Don't panic! You're just missing some dependencies. Here's how to fix it:

1. Make sure you've run `pnpm install`. (We won't judge if you forgot this step... much)
2. If you're still getting errors, try running:

```bash
pnpm install @types/node
```

3. If you're STILL getting errors, well... have you tried turning it off and on again?

## ⚠️ Warning

Running this script might make you so efficient at finding available domains that you'll be tempted to become a domain squatter. We're not responsible for any sudden career changes.

## 🤓 Pro Tips

- The script checks domains in chunks of 20 to avoid overwhelming the WHOIS servers (and your computer's will to live)
- There's a 2-second delay between chunks. Use this time to contemplate why you became a developer
- Results are saved in `available_domains.json`. It's like a treasure map, but for the internet!

## 🐛 Bugs

There are no bugs, only features you haven't discovered yet. If you find any, congratulations! You're now a QA engineer.

## 💖 Contributing

Found a way to make this even lazier? We're all ears! Fork, code, and send us a pull request. We promise to review it... right after we check these 10,000 domains.

## 📜 License

This project is licensed under the "Buy Us a Coffee If You Make Millions" License.

Remember: Stay lazy, stay curious, and may all your dream domains be available! 🦥👩‍💻👨‍💻
