import chalk from 'chalk'
import { CommandBuilder } from 'yargs'
import * as figures from 'figures'
import * as fs from 'fs'
import * as path from 'path'
import fetch from 'node-fetch'

const command: {
  command: string
  describe?: string
  handler: (context: any, argv: any) => any
  builder?: CommandBuilder
} = {
  command: 'up <schema>',
  describe: 'Bundle schemas and generate bindings',

  builder: {
    minimal: {
      alias: 'm',
      describe: 'Only print URLs of created APIs',
      type: 'boolean'
    }
  },

  handler: async (context: any, argv) => {
    if (!argv.minimal) {
      context.spinner.start('Creating your GraphQL API...')
    }

    const schema = await getSchema(argv.schema)

    const response = await fetch('https://graphql-up-api.graph.cool/create', {
      method: 'post',
      body: JSON.stringify({ schema }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const body = await response.json()

    if (!response.ok) {
      context.spinner.fail(body.message)
      process.exit(1)
    } else if (!argv.minimal) {
      context.spinner.succeed('Your GraphQL API is ready to use. Here are your endpoints:')
    }

    let message
    if (argv.minimal) {
      message = `https://api.graph.cool/simple/v1/${body.project.alias}
https://api.graph.cool/relay/v1/${body.project.alias}`
    } else {
      message = `
  ${chalk.blue(figures.pointer)} Simple API: https://api.graph.cool/simple/v1/${body.project.alias}
  ${chalk.blue(figures.pointer)} Relay API:  https://api.graph.cool/relay/v1/${body.project.alias}
  ${chalk.blue(figures.pointer)} Subscriptions API: wss://subscriptions.graph.cool/v1/${body.project.alias}

  
  ${chalk.bold('Open your GraphQL endpoint in a browser to use the interactive API Playground.')}

  API Documentation: https://www.graph.cool/docs/graphql-up/
`
    }

    console.log(message)
  }
}

async function getSchema(schemaProp: string): Promise<string> {
  if (schemaProp.startsWith('http')) {
    const response = await fetch(schemaProp)
    return await response.text()
  } else {
    return fs.readFileSync(path.resolve(schemaProp)).toString()
  }
}

function onError(e: Error) {
  console.log(`${chalk.red(figures.cross)} Error: ${e.message}\n`)
  console.log(e.stack)
  process.exit(1)
}

export = command
