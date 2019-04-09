const eth = require('ethers')
const provider = new eth.providers.JsonRpcProvider(Cypress.env('provider'))
const wallet = eth.Wallet.fromMnemonic(Cypress.env('mnemonic')).connect(provider)

// Exported object, attach anything to this that you want available in tests
const my = {}

my.mnemonicRegex = /([A-Za-z]{3,}\s?){12}/
my.addressRegex = /.*0x[0-9a-z]{40}.*/i

////////////////////////////////////////
// Vanilla cypress compilations
// These functions behave a lot like cy.whatever functions

my.doneStarting = () => cy.contains('span', /starting/i).should('not.exist')

my.goToDeposit = () => cy.get(`a[href="/deposit"]`).click() && my.doneStarting()
my.goToSettings = () => cy.get(`a[href="/settings"]`).click() && my.doneStarting()
my.goToReceive = () => cy.get(`a[href="/receive"]`).click() && my.doneStarting()
my.goToSend = () => cy.get(`a[href="/send"]`).click() && my.doneStarting()
my.goToCashout = () => cy.get(`a[href="/cashout"]`).click() && my.doneStarting()
my.goHome = () => cy.contains('button', /^home$/i).click() && my.doneStarting()
my.goBack = () => cy.contains('button', /^back$/i).click() && my.doneStarting()
my.goNextIntro = () => cy.contains('button', /^next$/i).click() && my.doneStarting()
my.goCloseIntro = () => cy.contains('button', /^got it!$/i).click() && my.doneStarting()

my.closeIntroModal = () => {
  my.goNextIntro()
  my.goNextIntro()
  cy.contains('button', my.mnemonicRegex).should('exist')
  my.goNextIntro()
  cy.contains('p', '??').should('not.exist')
  my.goNextIntro()
  cy.contains('p', '??').should('not.exist')
  my.goCloseIntro()
  my.doneStarting()
}

my.burnCard = (isCollateralized) => {
  my.goToSettings()
  cy.contains('button', /burn card/i).click()
  cy.contains('button', /burn$/i).click()
  if (isCollateralized) cy.contains('span', /processing withdrawal/i).should('exist')
  cy.contains('p', /burning/i).should('exist')
  if (isCollateralized) cy.contains('span', /processing withdrawal/i).should('not.exist')
  cy.contains('p', /burning/i).should('not.exist')
  my.closeIntroModal()
}

my.restoreMnemonic = (mnemonic) => {
  my.goToSettings()
  cy.contains('button', /import/i).click()
  cy.get('input[type="text"]').clear().type(mnemonic)
  cy.get('button').find('svg').click()
  my.goBack()
  my.doneStarting()
}

my.pay = (to, value) => {
  my.goToSend()
  cy.get('input[type="string"]').clear().type(to)
  cy.get('input[type="number"]').clear().type(value)
  cy.contains('button', /send/i).click()
  cy.contains('h5', /in progress/i).should('exist')
}

// TODO: check the reciepient balance before and after to confirm they got the cashout
my.cashout = () => {
  my.goToCashout()
  cy.log(`cashing out to ${wallet.address}`)
  cy.get('input[type="text"]').clear().type(wallet.address)
  cy.contains('button', /cash out eth/i).click()
  cy.contains('span', /processing withdrawal/i).should('exist')
  cy.contains('span', /processing withdrawal/i).should('not.exist')
  cy.contains('span', /withdraw confirmed/i).should('exist')
  my.getBalance().should('contain', '0.00')
}

////////////////////////////////////////
// Data handling & external promise functions

// Cypress needs control over the order things run in, so normal async/promises don't work right
// We need to return promise data by resolving a Cypress.Promise
// All promises, even Cypress ones, need to be wrapped in a `cy.wrap` for consistency

// If you want to assert against the return value of one of these & retry until it passes,
// use `cy.resolve` eg something like: `cy.resolve(my.function).should(blah)`
// but this won't work if my.function contains an assertion internally

my.getAddress = () => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    my.goToDeposit()
    cy.contains('button', my.addressRegex).invoke('text').then(address => {
      cy.log(`Got address: ${address}`)
      my.goBack()
      resolve(address)
    })
  }))
}

my.getMnemonic = () => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    my.goToSettings()
    cy.contains('button', my.mnemonicRegex).should('not.exist')
    cy.contains('button', /backup phrase/i).click()
    cy.contains('button', my.mnemonicRegex).should('exist')
    cy.contains('button', my.mnemonicRegex).invoke('text').then(mnemonic => {
      cy.log(`Got mnemonic: ${mnemonic}`)
      my.goBack()
      resolve(mnemonic)
    })
  }))
}

my.getAccount = () => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    return my.getMnemonic().then(mnemonic => {
      return my.getAddress().then(address => {
        return resolve({ address, mnemonic })
      })
    })
  }))
}

my.getOnchainBalance = () => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    return cy.wrap(wallet.provider.getBalance(wallet.address)).then(balance => {
      cy.log(`Onchain balance is ${balance.toString()} for ${wallet.address}`)
      resolve(balance.toString())
    })
  }))
}

my.getBalance = () => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    cy.get('h1').children('span').invoke('text').then(whole => {
      cy.get('h3').children('span').invoke('text').then(fraction => {
        cy.log(`Got balance: ${whole}${fraction}`)
        resolve(`${whole}${fraction}`)
      })
    })
  }))
}

my.deposit = (value) => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    my.getAddress().then(address => {
      cy.log(`Depositing ${value} eth into channel ${address}`)
      return cy.wrap(wallet.sendTransaction({
        to: address,
        value: eth.utils.parseEther(value)
      })).then(tx => {
        return cy.wrap(wallet.provider.waitForTransaction(tx.hash).then(() => {
          cy.contains('span', /processing deposit/i).should('exist')
          cy.contains('span', /processing deposit/i).should('not.exist')
          cy.contains('span', /deposit confirmed/i).should('exist')
          cy.resolve(my.getBalance).should('not.contain', '0.00')
          my.getBalance().then(resolve)
        }))
      })
    })
  }))
}

my.linkPay = (value) => {
  return cy.wrap(new Cypress.Promise((resolve, reject) => {
    my.goToSend()
    cy.get('input[type="number"]').clear().type(value)
    cy.contains('button', /link/i).click()
    cy.contains('button', Cypress.env('publicUrl')).invoke('text').then(redeemLink => {
      resolve(redeemLink)
    })
  }))
}

export default my
