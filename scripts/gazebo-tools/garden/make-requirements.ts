import endent from 'endent'
import fs from 'fs'
import yaml from 'js-yaml'
import {join} from 'path'
import {validateRequirementsYaml} from '../../src/requirements/generator/utils'
import type Link from '../../src/requirements/__types__/Link'
import type Requirement from '../../src/requirements/__types__/Requirement'
import {getGazeboLinks} from './get-gazebo-links'
import type GazeboRepoDocs from './__types__/GazeboRepoDocs'

async function main() {
  const outputFile = join(__dirname, 'gazebo-doc-requirements.yaml')
  const errorLogFile = join(__dirname, 'gazebo-doc-requirements-errors.txt')
  const commonLabelForRequirements = 'garden'

  const {repoDocs, errorText} = await getGazeboLinks({
    cacheDir: '.cache',
    gzDocsRepo: {
      url: 'https://github.com/gazebosim/docs',
      org: 'gazebosim',
      name: 'docs',
      branch: 'master',
      releaseName: 'garden',
    },
    gzWorldRepo: {
      url: 'https://github.com/gazebosim/gz-sim',
      org: 'gazebosim',
      name: 'gz-sim',
      branch: 'gz-sim7',
      pathToWoldFiles: 'examples/worlds',
    },
    gzTutorialRepos: {
      reposYamlUrl:
        'https://raw.githubusercontent.com/ignition-tooling/gazebodistro/master/collection-garden.yaml',
      reposToSkip: ['gz-cmake'],
      tutorialsDirectory: 'tutorials',
    },
    sdfTutorialRepo: {
      url: 'https://github.com/gazebosim/sdf_tutorials',
      relativePathToManifest: 'manifest.xml',
      org: 'gazebosim',
      name: 'sdf_tutorials',
      branch: 'master',
      handlesToSkip: /(proposal|roadmap|usd|bindings)/,
    },
  })
  const requirementsYaml = repoDocsToRequirementsYaml(
    repoDocs,
    commonLabelForRequirements,
  )
  const outputText = endent`
    # This requirements file was automatically generated by
    # ${__filename}. Do not edit it directly.

    ${requirementsYaml}
    `
  fs.writeFileSync(outputFile, outputText)

  if (errorText) {
    console.error(errorText)
    fs.writeFileSync(errorLogFile, errorText)
  }
}

function repoDocsToRequirementsYaml(
  repoDocs: GazeboRepoDocs[],
  commonLabel: string,
) {
  const requirements: Requirement[] = []
  repoDocs.forEach((repoDoc) => {
    repoDoc.docs.forEach((doc) => {
      const links: Link[] = []
      if (doc.liveUrl) {
        links.push({
          name: 'Live',
          url: doc.liveUrl,
        })
      }
      links.push({
        name: 'Source',
        url: doc.sourceUrl,
      })
      const labels = [repoDoc.repo, commonLabel]
      if (repoDoc.extraLabels) {
        labels.push(...repoDoc.extraLabels)
      }
      const req: Requirement = {
        name: `${repoDoc.repo}: ${doc.handle}`,
        links,
        checks: [
          {
            name: 'Instructions work',
          },
          {
            name: 'Images (if there are any) match the result',
          },
        ],
        labels,
      }
      requirements.push(req)
    })
  })
  const requirements_ = {
    requirements,
  }
  validateRequirementsYaml(requirements_)
  return yaml.dump(requirements_)
}

if (typeof require !== 'undefined' && require.main === module) {
  main()
}
