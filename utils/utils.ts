import { HardhatRuntimeEnvironment } from "hardhat/types"
import { retry } from "ts-retry"
import { Deployment, DeploymentSubmission } from "hardhat-deploy/dist/types"
import { DeployProxyOptions } from "@openzeppelin/hardhat-upgrades/dist/utils/options"
import { ethers } from "ethers"

export const deployProxyAndSave = async (
  name: string,
  args: any,
  hardhat: HardhatRuntimeEnvironment,
  deployOptions?: DeployProxyOptions
): Promise<string> => {
  return await deployProxyAndSaveAs(name, name, args, hardhat, deployOptions)
}

export const deployProxyAndSaveAs = async (
  factoryName: string,
  name: string,
  args: any,
  hardhat: HardhatRuntimeEnvironment,
  deployOptions?: DeployProxyOptions
): Promise<string> => {
  const contractFactory = await hardhat.ethers.getContractFactory(factoryName)
  let deployment = await hardhat.deployments.getOrNull(name)

  if (deployment) {
    console.log("✅ ", name, " already deployed")
    return deployment.address
  }

  let abi = (await hardhat.artifacts.readArtifact(name)).abi

  let contract = await hardhat.upgrades.deployProxy(contractFactory, args, deployOptions)
  
  contract = await contract.waitForDeployment()
  let receipt = await contract.deploymentTransaction()
  let tx = await receipt?.getTransaction()
  let contractAddress = await contract.getAddress()
  if (!receipt || !tx || !contractAddress) return ""



  const contractDeployment = {
    address: contractAddress,
    abi,
    receipt: {
      from: receipt.from,
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
      transactionIndex: tx.index,
      cumulativeGasUsed: 0,
      gasUsed: 0,
    },
  } as DeploymentSubmission

  await hardhat.deployments.save(name, contractDeployment)

  console.log("🚀 ", name, " deployed at ", contractAddress)
  return contractAddress
}

export const formatStableCredits = (value: ethers.BigNumberish) => {
  return ethers.formatUnits(value, "mwei")
}

export const parseStableCredits = (value: string) => {
  return ethers.parseUnits(value, "mwei")
}

export const getConfig = () => {
  let adminOwner = process.env.ADMIN_OWNER_ADDRESS
  let reserveTokenAddress = process.env.RESERVE_TOKEN_ADDRESS
  let swapRouterAddress = process.env.SWAP_ROUTER_ADDRESS
  return { adminOwner, reserveTokenAddress, swapRouterAddress }
}
