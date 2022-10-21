import Mirai, { message } from 'node-mirai-sdk'

export type PluginHandler<T extends any> = (message: message, bot: Mirai) => PromiseLike<T>
export interface Character {
  character: string,
  name: string,
  description: string,
  canUseGeneralPotentialItem: boolean,
  potentialItemId: string,
  nationId: string,
  groupId: string | null,
  teamId: string | null,
  displayNumber: string,
  tokenKey: string | null,
  appellation: string,
  position: string,
  tagList: string[],
  itemUsage: string,
  itemDesc: string,
  itemObtainApproach: string,
  isNotObtainable: false,
  isSpChar: false,
  maxPotentialLevel: number,
  rarity: number,
  profession: string,
  subProfessionId: string,
  trait: {
    candidates: Array<{
      unlockCondition: {
        phase: number,
        level: number
      },
      requiredPotentialRank: number,
      blackboard: Array<{ key: string, value: number }>,
      overrideDescripton: string | null,
      prefabKey: string | null,
      rangeId: string | null
    }>
  } | null,
  phases: Array<{
    characterPrefabKey: string,
    rangeId: string,
    maxLevel: number,
    attributesKeyFrames: Array<{
      level: number,
      data: {
        maxHp: number,
        atk: number,
        def: number,
        magicResistance: 0.0,
        cost: number,
        blockCnt: number,
        moveSpeed: 1.0,
        attackSpeed: 100.0,
        baseAttackTime: 2.4,
        respawnTime: number,
        hpRecoveryPerSec: 0.0,
        spRecoveryPerSec: 1.0,
        maxDeployCount: number,
        maxDeckStackCnt: number,
        tauntLevel: number,
        massLevel: number,
        baseForceLevel: number,
        stunImmune: false,
        silenceImmune: false,
        sleepImmune: false,
        frozenImmune: false,
        levitateImmune: false
      }
    }>,
    evolveCost: Array<{
      id: string,
      count: number,
      type: string
    }> | null
  }>,
  skills: Array<{
    skillId: string,
    overridePrefabKey: string | null,
    overrideTokenKey: string | null,
    levelUpCostCond: Array<{
      unlockCond: {
        phase: number,
        level: number
      },
      lvlUpTime: number,
      levelUpCost: Array<{
        id: string,
        count: number,
        type: string
      }>
    }>,
    unlockCond: {
      phase: number,
      level: number
    }
  }>,
  talents: Array<{
    candidates: Array<{
      unlockCondition: {
        phase: number,
        level: number
      },
      requiredPotentialRank: number,
      prefabKey: string,
      name: string,
      description: string,
      rangeId: string | null,
      blackboard: [
        {
          key: string,
          value: number
        }
      ]
    }>
  }>,
  potentialRanks: Array<{
    type: number,
    description: string,
    buff: {
      attributes: {
        abnormalFlags: string | null,
        abnormalImmunes: string | null,
        abnormalAntis: string | null,
        abnormalCombos: string | null,
        abnormalComboImmunes: string | null,
        attributeModifiers: Array<{
          attributeType: number,
          formulaItem: number,
          value: number,
          loadFromBlackboard: false,
          fetchBaseValueFromSourceEntity: false
        }>
      }
    },
    equivalentCost: null
  }>,
  favorKeyFrames: Array<{
    level: number,
    data: {
      maxHp: number,
      atk: number,
      def: number,
      magicResistance: 0.0,
      cost: number,
      blockCnt: number,
      moveSpeed: 0.0,
      attackSpeed: 0.0,
      baseAttackTime: 0.0,
      respawnTime: number,
      hpRecoveryPerSec: 0.0,
      spRecoveryPerSec: 0.0,
      maxDeployCount: number,
      maxDeckStackCnt: number,
      tauntLevel: number,
      massLevel: number,
      baseForceLevel: number,
      stunImmune: false,
      silenceImmune: false,
      sleepImmune: false,
      frozenImmune: false,
      levitateImmune: false
    }
  }>,
  allSkillLvlup: Array<{
    unlockCond: {
      phase: number,
      level: number
    },
    lvlUpCost: Array<{
      id: string,
      count: number,
      type: string
    }>
  }>,
  /** Added by `components/searchCharacter.ts` */
  subProfessionName?: string,
}

export interface SkillLevel {
  name: string,
  rangeId: string | null,
  description: string,
  skillType: number,
  durationType: number,
  spData: {
    spType: number,
    levelUpCost: string | null,
    maxChargeTime: number,
    spCost: number,
    initSp: number,
    increment: number
  },
  prefabId: string,
  duration: number,
  blackboard: Array<{
    key: string,
    value: number
  }>
}
export interface Skill {
  skillId: string,
  iconId: string | null,
  hidden: boolean,
  levels: Array<SkillLevel>
}
