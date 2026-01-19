<template>
  <!-- Bug #18 修复：数据加载前显示简洁的加载状态 -->
  <div v-if="!isDataLoaded" class="mystic-container loading-state">
    <div class="bg-pattern"></div>
    <div class="main-panel">
      <div class="panel-decor top"></div>
      <div class="loading-content">
        <span class="loading-text">正在加载...</span>
      </div>
      <div class="panel-decor bottom"></div>
    </div>
  </div>

  <!-- 数据加载完成后显示正常界面 -->
  <div
    v-else
    class="mystic-container"
    :class="{
      'truth-mode': isTruthMode && !showAfterStoryMode && !isNormalEndingLocked,
      'dream-mode': isDreamPhase && !showAfterStoryMode && !isNormalEndingLocked,
      'romance-mode': !isTruthMode && !isDreamPhase && !showAfterStoryMode && !isNormalEndingLocked,
      'after-story-mode': showAfterStoryMode,
      'normal-ending-mode': isNormalEndingLocked,
    }"
  >
    <!-- 背景纹理层 -->
    <div class="bg-pattern"></div>

    <!-- 主面板 -->
    <div class="main-panel">
      <!-- 顶部装饰线 -->
      <div class="panel-decor top"></div>

      <!-- ============================================ -->
      <!-- 普通结局锁定界面（时间循环重置） -->
      <!-- ============================================ -->
      <template v-if="isNormalEndingLocked">
        <header class="header">
          <div class="world-info">
            <span class="info-item time-display">
              <i class="icon">🔄</i>
              {{ worldData.时间 }}
            </span>
            <span class="divider">|</span>
            <span class="info-item"> 循环轮数 #{{ worldData.当前循环轮数 || 1 }} </span>
          </div>
          <span class="phase-tag phase-ending"> 时间循环 </span>
        </header>

        <!-- 结局信息 -->
        <section class="normal-ending-section">
          <div class="ending-card">
            <div class="ending-icon">🔄</div>
            <div class="ending-content">
              <div class="ending-title">时间循环已重置</div>
              <div class="ending-desc">你没有找到打破循环的方法...</div>
            </div>
          </div>
        </section>

        <!-- 结局提示 -->
        <section class="ending-hint-section">
          <div class="hint-text">
            <p>一切回到了原点。</p>
            <p>也许下一次，你能发现那扇隐藏的门...</p>
          </div>
        </section>

        <!-- 游戏结束提示 -->
        <section class="game-over-section">
          <div class="game-over-card">
            <span class="game-over-text">游戏已结束</span>
            <span class="game-over-hint">如需重新开始，请重置存档</span>
          </div>
        </section>
      </template>

      <!-- ============================================ -->
      <!-- 后日谈/自由模式界面 -->
      <!-- ============================================ -->
      <template v-else-if="showAfterStoryMode">
        <!-- 头部：真实日期、进度和结局类型 -->
        <!-- Bug #14 修复：添加真实日期显示 -->
        <header class="header">
          <div class="world-info">
            <span class="info-item time-display">
              <i class="icon">📅</i>
              {{ realDateDisplay }}
            </span>
            <span class="divider">|</span>
            <span class="info-item">
              <i class="icon">🌟</i>
              {{ afterStoryProgressText }}
            </span>
            <span class="divider">|</span>
            <span class="info-item">
              {{ endingTypeName }}
            </span>
          </div>
          <span class="phase-tag phase-after-story"> 后日谈 </span>
        </header>

        <!-- 赵霞状态 -->
        <section class="character-section">
          <div class="location-row">
            <span class="location-icon">📍</span>
            <span class="location-text"
              >赵霞正在<span class="highlight">{{ zhaoxiaData.当前位置 }}</span></span
            >
          </div>
          <div class="thought-bubble">
            <span class="thought-icon">💭</span>
            <span class="thought-text">{{ zhaoxiaData.心理活动 }}</span>
          </div>
        </section>

        <!-- 后日谈提示 -->
        <section class="after-story-info">
          <div class="info-card">
            <div class="info-icon">💕</div>
            <div class="info-content">
              <template v-if="isInFreeMode">
                <div class="info-title">自由模式已解锁</div>
                <div class="info-desc">没有时间限制，尽情享受吧</div>
              </template>
              <template v-else>
                <div class="info-title">后日谈进行中</div>
                <div class="info-desc">体验结局后的日常</div>
              </template>
            </div>
          </div>
        </section>

        <!-- 苏文状态（根据结局类型显示不同状态） -->
        <section class="husband-status after-story-husband">
          <div class="husband-row">
            <span class="husband-icon">👤</span>
            <span class="husband-text">{{ afterStoryHusbandStatus }}</span>
          </div>
        </section>
      </template>

      <!-- ============================================ -->
      <!-- 梦境模式界面（紫色主题，与纯爱模式框架一致） -->
      <!-- ============================================ -->
      <template v-else-if="isDreamPhase">
        <!-- 头部：时间和场景信息 -->
        <!-- Bug #14 修复：Day 6+时显示真实日期 -->
        <header class="header">
          <div class="world-info">
            <span class="info-item time-display">
              <i class="icon">🌙</i>
              {{ shouldShowRealDate ? realDateDisplay : worldData.时间 }}
            </span>
            <span class="divider">|</span>
            <span class="info-item">
              {{ currentSceneTitle }}
            </span>
          </div>
          <span class="phase-tag phase-dream"> {{ dreamMemoryAge }}岁记忆 </span>
        </header>

        <!-- 梦境状态区域（心理活动） -->
        <section class="character-section">
          <!-- 心理活动 -->
          <div class="thought-bubble" v-if="dreamThought">
            <span class="thought-icon">💭</span>
            <span class="thought-text">{{ dreamThought }}</span>
          </div>
        </section>

        <!-- 本次目标（简化显示） -->
        <section class="outfit-section" v-if="dreamObjective">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">本次目标</span>
            <span class="decor-line"></span>
          </div>
          <div class="objective-text">🎯 {{ dreamObjective }}</div>
        </section>

        <!-- 记忆背景故事 -->
        <section class="memory-backstory" v-if="memoryBackstory">
          <div class="backstory-header">
            <span class="backstory-icon">📖</span>
            <span class="backstory-title">记忆背景</span>
          </div>
          <div class="backstory-content">
            {{ memoryBackstory }}
          </div>
        </section>

        <!-- 核心数值区 -->
        <section class="stats-section">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">情感状态</span>
            <span class="decor-line"></span>
          </div>

          <!-- 两列布局 -->
          <div class="stats-grid">
            <!-- 左列：依存度和道德底线 -->
            <div class="stats-column">
              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">💕 依存度</span>
                  <span class="num">{{ zhaoxiaData.依存度 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar desire" :style="{ width: zhaoxiaData.依存度 + '%' }"></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">🛡️ 道德底线</span>
                  <span class="num">{{ zhaoxiaData.道德底线 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar moral" :style="{ width: zhaoxiaData.道德底线 + '%' }"></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">🌀 记忆混乱</span>
                  <span class="num" :class="{ danger: dreamData.记忆混乱度 >= 80 }">{{ dreamData.记忆混乱度 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar chaos" :style="{ width: dreamData.记忆混乱度 + '%' }"></div>
                </div>
              </div>
            </div>

            <!-- 右列：认知开发 -->
            <div class="stats-column">
              <div class="body-grid-container">
                <div class="body-grid" :class="{ dimmed: showSelectionOverlay }">
                  <div v-for="part in bodyParts" :key="part.key" class="body-item">
                    <span class="part-name">{{ part.name }}</span>
                    <div class="mini-progress">
                      <div class="mini-bar" :style="{ width: part.value + '%' }"></div>
                    </div>
                    <span class="part-value">{{ part.value }}</span>
                  </div>
                </div>

                <!-- 梦境部位选择遮罩层 -->
                <div v-if="showSelectionOverlay" class="selection-overlay">
                  <div class="selection-header">
                    <span class="selection-icon">🌙</span>
                    <span class="selection-title">记忆主题选择</span>
                  </div>
                  <div class="selection-hint">选择核心部位</div>
                  <div class="selection-grid">
                    <div
                      v-for="part in selectableParts"
                      :key="part.key"
                      :class="['selection-item', { selected: selectedParts.includes(part.key) }]"
                      @click="togglePartSelection(part.key)"
                    >
                      <div class="selection-checkbox">
                        <span v-if="selectedParts.includes(part.key)" class="check-mark">✓</span>
                      </div>
                      <span class="selection-part-name">{{ part.name }}</span>
                    </div>
                  </div>
                  <button class="confirm-button" :disabled="selectedParts.length === 0" @click="confirmSelection">
                    确认 ({{ selectedParts.length }})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 底部记忆稳定度进度条 -->
        <section class="memory-stability-section" v-if="currentSceneNumber !== 5">
          <div class="stability-header">
            <span class="stability-icon">⏳</span>
            <span class="stability-title">记忆稳定度</span>
            <span class="stability-value">{{ Math.round(100 - memoryCollapseProgress) }}%</span>
            <span class="stability-time">🕐 {{ hoursUntilWakeUp }}h后醒来</span>
          </div>
          <div class="stability-progress-track">
            <div class="stability-progress-bar" :style="{ width: 100 - memoryCollapseProgress + '%' }"></div>
          </div>
        </section>
        <!-- 场景5：暗示进度条 -->
        <section class="memory-stability-section" v-else-if="scene5Data">
          <div class="stability-header">
            <span class="stability-icon">💊</span>
            <span class="stability-title">暗示进度</span>
            <span class="stability-value">{{ scene5Data.当前步骤 || 0 }}/12</span>
            <span class="stability-time">完成度 {{ scene5Data.完成度 || 0 }}%</span>
          </div>
          <div class="stability-progress-track">
            <div
              class="stability-progress-bar suggestion"
              :style="{ width: ((scene5Data.当前步骤 || 0) / 12) * 100 + '%' }"
            ></div>
          </div>
        </section>
      </template>

      <!-- ============================================ -->
      <!-- 恋爱模式界面（伪装模式，浅粉色主题） -->
      <!-- ============================================ -->
      <template v-else-if="!isTruthMode">
        <!-- 头部：时间和倒计时 -->
        <!-- Bug #14 修复：Day 6+时显示真实日期 -->
        <header class="header">
          <div class="world-info">
            <span class="info-item time-display">
              <i class="icon">🌸</i>
              {{ shouldShowRealDate ? realDateDisplay : worldData.时间 }}
            </span>
            <span class="divider">|</span>
            <template v-if="shouldShowRealDate">
              <span class="info-item"> {{ endingTypeName || '结局' }} · 结局中 </span>
            </template>
            <template v-else>
              <span class="info-item countdown" :class="{ urgent: hoursUntilReset <= 24 }">
                <i class="icon">⏰</i>
                {{ hoursUntilReset <= 24 ? '最后一天' : `距循环重置 ${hoursUntilReset}h` }}
              </span>
            </template>
          </div>
          <span :class="['phase-tag', shouldShowRealDate ? 'phase-after-story' : phaseClass]">
            {{ shouldShowRealDate ? '结局模式' : phaseName }}
          </span>
        </header>

        <!-- 赵霞位置和心理 -->
        <section class="character-section">
          <div class="location-row">
            <span class="location-icon">📍</span>
            <span class="location-text"
              >赵霞正在<span class="highlight">{{ zhaoxiaData.当前位置 }}</span></span
            >
          </div>
          <div class="thought-bubble">
            <span class="thought-icon">💭</span>
            <span class="thought-text">{{ zhaoxiaData.心理活动 }}</span>
          </div>
        </section>

        <!-- 服装详情 -->
        <section class="outfit-section">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">当前装扮</span>
            <span class="decor-line"></span>
          </div>
          <div class="outfit-grid">
            <div class="outfit-item" v-for="(value, key) in outfitDisplay" :key="key">
              <span class="outfit-label">{{ key }}</span>
              <span class="outfit-value">{{ value }}</span>
            </div>
            <!-- 妆容和配件 -->
            <div class="outfit-item">
              <span class="outfit-label">妆容</span>
              <span class="outfit-value">{{ zhaoxiaData.妆容 || '淡妆' }}</span>
            </div>
            <div class="outfit-item">
              <span class="outfit-label">配件</span>
              <span class="outfit-value">{{ zhaoxiaData.配件 || '婚戒' }}</span>
            </div>
          </div>
        </section>

        <!-- 核心数值区 -->
        <section class="stats-section">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">关系状态</span>
            <span class="decor-line"></span>
          </div>

          <!-- 两列布局 -->
          <div class="stats-grid">
            <!-- 左列：与主角的关系 -->
            <div class="stats-column">
              <div class="relationship-card">
                <div class="relation-header">
                  <span class="relation-icon">💕</span>
                  <span class="relation-title">与你的关系</span>
                </div>
                <div class="relation-value">{{ pureLoveRelationshipText }}</div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">❤️ 好感度</span>
                  <span class="num">{{ pureLoveAffection }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar affection" :style="{ width: pureLoveAffection + '%' }"></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">🌹 亲密度</span>
                  <span class="num">{{ pureLoveIntimacy }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar intimacy" :style="{ width: pureLoveIntimacy + '%' }"></div>
                </div>
              </div>
            </div>

            <!-- 右列：境界和苏文相关 -->
            <div class="stats-column">
              <div class="realm-card">
                <div class="realm-header">
                  <span class="realm-icon">✨</span>
                  <span class="realm-title">关系阶段</span>
                </div>
                <div class="realm-value">{{ pureLoveRealmName }}</div>
                <div class="realm-progress">
                  <div class="realm-bar" :style="{ width: (pureLoveStage / 5) * 100 + '%' }"></div>
                </div>
                <div class="realm-hint">{{ pureLoveRealmHint }}</div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">💑 对丈夫好感</span>
                  <span class="num">{{ husbandAffection }}</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-bar husband"
                    :style="{ width: Math.max(0, (husbandAffection + 50) / 1.5) + '%' }"
                  ></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">👁️ 丈夫的疑心</span>
                  <span class="num" :class="{ danger: realData.丈夫怀疑度 >= 60 }">{{ realData.丈夫怀疑度 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar suspicion" :style="{ width: realData.丈夫怀疑度 + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 苏文状态提示 -->
        <section class="husband-status">
          <div class="husband-row">
            <span class="husband-icon">{{ husbandIcon }}</span>
            <span class="husband-text">{{ husbandStatusText }}</span>
            <span :class="['risk-badge', riskClass]">{{ riskText }}</span>
          </div>
        </section>
      </template>

      <!-- ============================================ -->
      <!-- 真相模式界面（重构版：与纯爱/梦境一致的框架） -->
      <!-- ============================================ -->
      <template v-else-if="isTruthMode">
        <!-- 头部：时间和倒计时（与纯爱模式一致） -->
        <!-- Bug #14/#16 修复：Day 6+或自由模式时显示真实日期 -->
        <header class="header">
          <div class="world-info">
            <span class="info-item time-display">
              <i class="icon">🔥</i>
              <!-- Day 6+或自由模式显示真实日期，否则显示游戏时间 -->
              {{ shouldShowRealDate ? realDateDisplay : worldData.时间 }}
            </span>
            <span class="divider">|</span>
            <!-- Day 6+或自由模式显示结局类型，否则显示倒计时 -->
            <template v-if="shouldShowRealDate">
              <span class="info-item">
                {{ endingTypeName || '结局' }} · {{ isInFreeMode ? '自由模式' : '结局中' }}
              </span>
            </template>
            <template v-else>
              <span class="info-item countdown" :class="{ urgent: hoursUntilReset <= 24 }">
                <i class="icon">⏰</i>
                {{ hoursUntilReset <= 24 ? '最后一天' : `距循环重置 ${hoursUntilReset}h` }}
              </span>
              <template v-if="worldData.当前循环轮数 > 1">
                <span class="divider">|</span>
                <span class="info-item loop">循环 #{{ worldData.当前循环轮数 }}</span>
              </template>
            </template>
          </div>
          <span class="phase-tag" :class="shouldShowRealDate ? 'phase-after-story' : 'phase-truth'">
            {{ shouldShowRealDate ? (isInFreeMode ? '自由模式' : '结局模式') : '真相模式' }}
          </span>
        </header>

        <!-- 赵霞位置和心理（与纯爱模式一致） -->
        <section class="character-section">
          <div class="location-row">
            <span class="location-icon">📍</span>
            <span class="location-text"
              >赵霞正在<span class="highlight">{{ zhaoxiaData.当前位置 }}</span></span
            >
          </div>
          <div class="thought-bubble">
            <span class="thought-icon">💭</span>
            <span class="thought-text">{{ zhaoxiaData.心理活动 }}</span>
          </div>
        </section>

        <!-- 服装详情（真相模式增强版） -->
        <section class="outfit-section">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">当前装扮</span>
            <span class="decor-line"></span>
          </div>
          <div class="outfit-grid">
            <div class="outfit-item" v-for="(value, key) in outfitDisplay" :key="key">
              <span class="outfit-label">{{ key }}</span>
              <span class="outfit-value">{{ value }}</span>
            </div>
            <div class="outfit-item">
              <span class="outfit-label">妆容</span>
              <span class="outfit-value">{{ zhaoxiaData.妆容 || '淡妆' }}</span>
            </div>
            <div class="outfit-item">
              <span class="outfit-label">配件</span>
              <span class="outfit-value">{{ zhaoxiaData.配件 || '婚戒' }}</span>
            </div>
            <!-- 改造（真相模式专属） -->
            <div class="outfit-item modification" v-if="zhaoxiaData.改造 && zhaoxiaData.改造.length > 0">
              <span class="outfit-label">改造</span>
              <span class="outfit-value modification-list">{{ zhaoxiaData.改造.join('、') }}</span>
            </div>
          </div>
        </section>

        <!-- 核心数值区（两列布局：与纯爱/梦境一致） -->
        <section class="stats-section">
          <div class="section-title">
            <span class="decor-line"></span>
            <span class="title-text">深层状态</span>
            <span class="decor-line"></span>
          </div>

          <div class="stats-grid">
            <!-- 左列：境界卡片 + 核心数值 + 丈夫疑心 -->
            <div class="stats-column">
              <!-- 境界卡片（替代原有圆环） -->
              <div class="realm-card truth-realm">
                <div class="realm-header">
                  <span class="realm-icon">🔮</span>
                  <span class="realm-title">当前境界</span>
                </div>
                <div class="realm-value">{{ realmName }}</div>
                <div class="realm-progress">
                  <div class="realm-bar" :style="{ width: (zhaoxiaData.当前境界 / 5) * 100 + '%' }"></div>
                </div>
                <div class="realm-hint">{{ truthRealmHint }}</div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">💕 依存度</span>
                  <span class="num">{{ zhaoxiaData.依存度 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar desire" :style="{ width: zhaoxiaData.依存度 + '%' }"></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">🛡️ 道德底线</span>
                  <span class="num">{{ zhaoxiaData.道德底线 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar moral" :style="{ width: zhaoxiaData.道德底线 + '%' }"></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">💔 丈夫依存</span>
                  <span class="num">{{ zhaoxiaData.对丈夫依存度 }}</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-bar husband"
                    :style="{ width: Math.max(0, (zhaoxiaData.对丈夫依存度 + 50) / 1.5) + '%' }"
                  ></div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-header">
                  <span class="name">👁️ 丈夫疑心</span>
                  <span class="num" :class="{ danger: realData.丈夫怀疑度 >= 80 }">{{ realData.丈夫怀疑度 }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar suspicion" :style="{ width: realData.丈夫怀疑度 + '%' }"></div>
                </div>
              </div>
            </div>

            <!-- 右列：认知开发（2x3网格） -->
            <div class="stats-column">
              <!-- 认知开发（部位进度） -->
              <div class="body-grid-container">
                <div class="body-grid">
                  <div v-for="part in bodyParts" :key="part.key" class="body-item">
                    <span class="part-name">{{ part.name }}</span>
                    <div class="mini-progress">
                      <div class="mini-bar" :style="{ width: part.value + '%' }"></div>
                    </div>
                    <span class="part-value">{{ part.value }}</span>
                  </div>
                  <!-- 第6格：梦境入口倒计时 / 自由模式结局信息 -->
                  <!-- Bug #17 修复：Day 5 或结局阶段时显示"已关闭" -->
                  <!-- Bug #21 修复：自由模式时显示结局信息 -->
                  <template v-if="isInFreeMode">
                    <div class="body-item ending-info-item">
                      <span class="part-name">🎊 {{ endingTypeName }}</span>
                      <div class="ending-badge">
                        <span class="ending-status">自由模式</span>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <div
                      class="body-item dream-countdown-item"
                      :class="{
                        'dream-open': isDreamWindowOpen && !isDreamBlocked,
                        'dream-blocked': isDreamBlocked,
                      }"
                    >
                      <span class="part-name">🌙 梦境入口</span>
                      <div class="countdown-display">
                        <template v-if="isDreamBlocked">
                          <span class="countdown-status blocked">已关闭</span>
                        </template>
                        <template v-else-if="isDreamWindowOpen">
                          <span class="countdown-status open">已开启</span>
                        </template>
                        <template v-else>
                          <span class="countdown-time">{{ hoursUntilDreamWindow }}h</span>
                          <span class="countdown-label">后开启</span>
                        </template>
                      </div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 结局结算区域（Day 5, 10:00+） -->
              <div v-if="showEndingSettlement" class="ending-settlement">
                <!-- 头部：左侧标题 + 右侧结局预测 -->
                <div class="settlement-header">
                  <div class="header-left">
                    <span class="settlement-icon">📋</span>
                    <span class="settlement-title">记忆重构</span>
                  </div>
                  <div class="header-right">
                    <span :class="['ending-prediction', endingPredictionClass]">
                      {{ endingPredictionText }}
                    </span>
                  </div>
                </div>

                <!-- 场景完成列表 -->
                <div class="scene-checklist">
                  <div
                    v-for="status in sceneStatuses"
                    :key="status.scene"
                    :class="[
                      'scene-item',
                      {
                        completed: status.completed,
                        correct: status.correct,
                        missed: !status.completed,
                      },
                    ]"
                  >
                    <span class="scene-checkbox">
                      <template v-if="status.correct">✓</template>
                      <template v-else-if="status.completed">✗</template>
                      <template v-else>○</template>
                    </span>
                    <span class="scene-number">{{ status.scene }}</span>
                    <span class="scene-name">{{ status.title }}</span>
                  </div>
                </div>

                <!-- 底部：结局倒计时提示 -->
                <div class="ending-countdown">
                  <template v-if="endingData.当前结局 !== '未触发'">
                    <span class="countdown-icon">🎬</span>
                    <span class="countdown-text">结局已触发，快去找赵霞吧</span>
                  </template>
                  <template v-else>
                    <span class="countdown-icon">⏳</span>
                    <span class="countdown-text">
                      距结局结算还有 <strong>{{ hoursUntilEnding }}</strong> 小时，快去找赵霞
                    </span>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 苏文状态（与纯爱模式一致的行内布局） -->
        <!-- Bug #21 修复：自由模式时显示结局后的苏文状态 -->
        <section class="husband-status">
          <div class="husband-row">
            <template v-if="isInFreeMode">
              <span class="husband-icon">👤</span>
              <span class="husband-text">{{ afterStoryHusbandStatus }}</span>
            </template>
            <template v-else>
              <span class="husband-icon">{{ husbandIcon }}</span>
              <span class="husband-text">{{ husbandStatusText }}</span>
              <span :class="['risk-badge', riskClass]">{{ riskText }}</span>
            </template>
          </div>
        </section>

        <!-- 底部：苦主视角（丈夫心理活动） / 自由模式提示 -->
        <!-- 真相模式专属，一定显示（AI必须生成苦主视角内容） -->
        <!-- Bug #21 修复：自由模式时显示自由模式提示（假好结局除外，苏文还在家） -->
        <section class="truth-footer">
          <!-- 自由模式 + 非假好结局：显示自由模式提示 -->
          <template v-if="isInFreeMode && endingData.当前结局 !== '假好结局'">
            <!-- 自由模式提示区 -->
            <div class="free-mode-info">
              <div class="free-mode-header">
                <span class="free-mode-icon">🎊</span>
                <span class="free-mode-title">自由模式已解锁</span>
              </div>
              <div class="free-mode-content">
                <p class="free-mode-text">时间循环已被打破，赵霞逃出了命运的牢笼。</p>
                <p class="free-mode-hint">没有时间限制，尽情享受与她的日常吧。</p>
              </div>
            </div>
          </template>
          <!-- 假好结局自由模式或非自由模式：显示苦主视角 -->
          <template v-else>
            <!-- 苦主视角展示区 -->
            <div class="husband-perspective">
              <div class="perspective-header">
                <span class="perspective-icon">👤</span>
                <span class="perspective-title">苦主视角</span>
                <span class="perspective-suspicion" :class="{ danger: realData.丈夫怀疑度 >= 60 }">
                  疑心 {{ realData.丈夫怀疑度 }}%
                </span>
              </div>
              <div class="perspective-content">
                <p class="perspective-thought">{{ husbandPerspective }}</p>
              </div>
            </div>
          </template>
        </section>
      </template>

      <!-- 底部装饰线 -->
      <div class="panel-decor bottom"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDataStore } from './store';

const store = useDataStore();

// ============================================
// Bug #18 修复：数据加载检查（九次修复）
// ============================================
// 检查数据是否已正确加载
// 使用 getCurrentMessageId() 获取当前 iframe 所在楼层的 ID
// 这确保每个状态栏显示各自楼层的数据
const isDataLoaded = computed(() => {
  // 首先检查 store.data 基本结构
  if (!store.data || typeof store.data !== 'object' || !('世界' in store.data)) {
    return false;
  }

  // 使用当前 iframe 的楼层 ID 检查数据
  const currentMsgId = getCurrentMessageId();
  const messageVars = getVariables({ type: 'message', message_id: currentMsgId });
  const hasRealData = _.has(messageVars, 'stat_data.世界');

  return hasRealData;
});

// ============================================
// 梦境部位选择相关状态
// ============================================
const selectedParts = ref<string[]>([]);

// 数据访问
const worldData = computed(
  () =>
    store.data?.世界 ?? {
      当前天数: 1,
      当前小时: 8,
      时间: 'Day 1, 08:00',
      已进入过梦境: false,
      游戏阶段: '序章',
      循环状态: '进行中',
      当前循环轮数: 1,
      _梦境入口消息ID: undefined as number | undefined,
      _梦境入口天数: undefined as number | undefined,
      梦境选择已锁定: false,
    },
);

const zhaoxiaData = computed(
  () =>
    store.data?.赵霞状态 ?? {
      依存度: 0,
      道德底线: 80,
      对丈夫依存度: 60,
      当前境界: 1,
      部位进度: { 嘴巴: 0, 胸部: 0, 下体: 0, 后穴: 0, 精神: 0 },
      当前位置: '客厅',
      服装: {
        上衣: '米色真丝连衣裙上衣部分',
        下装: '米色真丝连衣裙裙摆',
        内衣: '白色蕾丝内衣',
        内裤: '白色蕾丝内裤',
        袜子: '肉色丝袜',
        鞋子: '米色平底鞋',
      },
      妆容: '淡妆',
      配件: '婚戒',
      改造: [] as string[],
      纯爱好感度: 5,
      纯爱亲密度: 0,
      心理活动: '今天天气不错，该准备午餐了...',
    },
);

const dreamData = computed(
  () =>
    store.data?.梦境数据 ?? {
      已完成场景: [],
      正确重构场景: [],
      记忆混乱度: 0,
      当前记忆年龄: undefined as number | undefined,
      梦境心理活动: undefined as string | undefined,
      此次梦境目标: undefined as string | undefined,
    },
);

// ============================================
// 梦境模式专用计算属性
// ============================================

// 场景标题配置（与 dreamKeywordDetection.ts 中的 DREAM_SCENE_INFO 保持同步）
const SCENE_TITLES: Record<number, string> = {
  1: '初恋的夏日',
  2: '等待中的屈辱',
  3: '生日之夜的逃离',
  4: '争吵后的放纵',
  5: '花嫁的誓约',
};

// 场景默认目标配置
const SCENE_OBJECTIVES: Record<number, string> = {
  1: '将初吻对象替换为你',
  2: '成为她的保护者',
  3: '守护她的初夜',
  4: '接受她的全部',
  5: '改写她的婚礼记忆',
};

// 当前场景标题
const currentSceneTitle = computed(() => {
  return SCENE_TITLES[currentSceneNumber.value] ?? '未知场景';
});

// 梦境中赵霞的记忆年龄（根据场景自动计算或使用AI设置的值）
const dreamMemoryAge = computed(() => {
  // 如果AI设置了具体年龄，使用它
  if (store.data?.梦境数据?.当前记忆年龄) {
    return store.data.梦境数据.当前记忆年龄;
  }
  // 否则根据场景推算默认年龄（与 dreamKeywordDetection.ts 保持同步）
  const sceneAges: Record<number, number> = {
    1: 16, // 场景1：初恋的夏日
    2: 17, // 场景2：等待中的屈辱
    3: 23, // 场景3：生日之夜的逃离
    4: 28, // 场景4：争吵后的放纵
    5: 25, // 场景5：花嫁的誓约（结婚当天，25岁）
  };
  return sceneAges[currentSceneNumber.value] ?? 35;
});

// 记忆崩塌进度（基于时间计算）
// 场景1-4：22:00进入=0%, 10:00退出=100%，总共12小时
// 场景5：白天进入（08:00-19:00）=0%, 20:00退出=100%，总共12小时（从当前梦境数据中的进入时间计算）
const memoryCollapseProgress = computed(() => {
  const currentHour = worldData.value.当前小时;
  const isScene5 = currentSceneNumber.value === 5;

  if (isScene5) {
    // 场景5：从进入时间计算到20:00
    // 获取进入时间（从梦境数据中读取）
    const scene5Data = store.data?.梦境数据?.场景5;
    if (!scene5Data?.进入时间) {
      return 0; // 未进入场景5
    }

    // 解析进入时间，提取小时数
    const entryTimeMatch = scene5Data.进入时间.match(/(\d{2}):00/);
    const entryHour = entryTimeMatch ? parseInt(entryTimeMatch[1], 10) : 8;

    // 计算从进入时间到20:00的总小时数
    let totalHours: number;
    if (entryHour < 20) {
      totalHours = 20 - entryHour;
    } else {
      totalHours = 0; // 不应该发生（场景5只能08:00-19:00进入）
    }

    // 计算当前经过的小时数
    let hoursFromStart: number;
    if (currentHour >= entryHour && currentHour < 20) {
      hoursFromStart = currentHour - entryHour;
    } else if (currentHour >= 20) {
      hoursFromStart = totalHours; // 已达到20:00，进度=100%
    } else {
      hoursFromStart = 0; // 当前时间在进入时间之前（不应该发生）
    }

    // 进度 = 经过时间 / 总时间 * 100
    const progress = totalHours > 0 ? Math.min(100, (hoursFromStart / totalHours) * 100) : 0;
    return progress;
  } else {
    // 场景1-4：22:00进入，10:00退出
    let hoursFromStart: number;
    if (currentHour >= 22) {
      // 22:00-23:59: 经过 0-2 小时
      hoursFromStart = currentHour - 22;
    } else if (currentHour < 10) {
      // 00:00-09:59: 经过 2-12 小时
      hoursFromStart = 24 - 22 + currentHour; // 2 + currentHour
    } else {
      // 10:00+ 已经崩塌
      hoursFromStart = 12;
    }

    // 进度 = 经过时间 / 总时间 * 100
    const progress = Math.min(100, (hoursFromStart / 12) * 100);
    return progress;
  }
});

// 距离醒来的小时数
// 场景1-4：在10:00醒来
// 场景5：在20:00强制退出
const hoursUntilWakeUp = computed(() => {
  const currentHour = worldData.value.当前小时;
  const isScene5 = currentSceneNumber.value === 5;

  if (isScene5) {
    // 场景5：计算到20:00的剩余时间
    if (currentHour < 20) {
      return 20 - currentHour;
    }
    return 0; // 已经到了或过了20:00
  } else {
    // 场景1-4：计算到10:00的剩余时间
    if (currentHour >= 22) {
      // 22:00-23:59 -> 距离10:00还有 (24-currentHour) + 10 小时
      return 24 - currentHour + 10;
    } else if (currentHour < 10) {
      // 00:00-09:59 -> 距离10:00还有 10 - currentHour 小时
      return 10 - currentHour;
    }
    return 0; // 已经过了10:00
  }
});

// 梦境中的心理活动（第一人称：记忆中赵霞的想法）
// 注意：梦境中赵霞不认识玩家，这是她记忆中那个年龄的内心独白
const dreamThought = computed(() => {
  // 如果AI设置了心理活动，使用它
  if (store.data?.梦境数据?.梦境心理活动) {
    return store.data.梦境数据.梦境心理活动;
  }
  // 否则返回默认心理活动（第一人称，示例文本）
  const defaultThoughts: Record<number, string> = {
    1: '他...他在看我吗？心跳得好快...这是我第一次和男生独处，他会不会觉得我很奇怪？',
    2: '苏文怎么还不来...已经等了快一个小时了...他们...他们为什么一直盯着我看？我好害怕...',
    3: '我们多久没有一起吃饭了？他每天都这么晚回来...我是不是已经不重要了？',
    4: '不...不应该有这种想法的...但是...如果只是试一试的话...应该没关系吧？',
    5: '今天...是我一生中最重要的日子...可是...为什么心里有种说不出的不安呢？我真的准备好了吗？',
  };
  return defaultThoughts[currentSceneNumber.value] ?? '这段记忆...我好像想起了什么...';
});

// 此次梦境目标
const dreamObjective = computed(() => {
  // 如果AI设置了目标，使用它
  if (store.data?.梦境数据?.此次梦境目标) {
    return store.data.梦境数据.此次梦境目标;
  }
  // 使用场景默认目标
  return SCENE_OBJECTIVES[currentSceneNumber.value] ?? '探索这段记忆';
});

// 记忆背景故事
const memoryBackstory = computed(() => {
  // 如果AI设置了背景故事，使用它
  if (store.data?.梦境数据?.记忆背景故事) {
    return store.data.梦境数据.记忆背景故事;
  }
  // 否则返回默认背景故事（示例文本，等待AI生成真实内容）
  // 注意：在梦境中赵霞不认识玩家，玩家是以陌生人身份进入她的记忆
  const defaultBackstories: Record<number, string> = {
    1: '16岁的夏天，校园中弥漫着蝉鸣与青草的气息。少女赵霞正处于情窦初开的年纪，暗恋着一个叫苏文的男生。某个夏日的午后，一个陌生人出现在她的世界里...',
    2: '17岁的赵霞独自等在放学后的某处，男朋友苏文迟迟没有出现。她发育明显的身体引来了一群人的注意和调戏，感到羞耻、害怕、无助。就在这时，一个熟悉的身影出现了...',
    3: '23岁生日这天，苏文在高档餐厅为赵霞庆祝。她喝了很多酒，意识逐渐模糊。当她在陌生的酒店房间醒来时，发现苏文正准备...她惊恐地逃离，在走廊上撞见了一个熟悉的身影...',
    4: '28岁的赵霞与苏文又吵了一架。结婚五年，争吵已经成了家常便饭。她愤怒地摔门而出，独自在某处借酒消愁。深夜的寒风中，一个熟悉的身影出现在她身旁...',
    5: '25岁的今天，是赵霞人生中最重要的日子——她即将穿上婚纱，与苏文步入婚姻殿堂。在婚礼的化妆间里，她凝视着镜中身穿洁白婚纱的自己，内心却涌起一丝莫名的不安。就在这时，门口出现了一个陌生却又似曾相识的身影...',
  };
  return defaultBackstories[currentSceneNumber.value] ?? '';
});

// 获取部位图标
function getBodyPartIcon(partKey: string): string {
  const icons: Record<string, string> = {
    嘴巴: '👄',
    胸部: '💗',
    下体: '🌸',
    后穴: '🍑',
    精神: '🧠',
  };
  return icons[partKey] ?? '⭕';
}

// 获取部位等级 (0-19=0, 20-39=1, 40-59=2, 60-79=3, 80-100=4)
function getBodyPartLevel(value: number): number {
  if (value >= 80) return 4;
  if (value >= 60) return 3;
  if (value >= 40) return 2;
  if (value >= 20) return 1;
  return 0;
}

const realData = computed(
  () =>
    store.data?.现实数据 ?? {
      丈夫怀疑度: 0,
      丈夫当前位置: '外出',
      丈夫心理活动: undefined as string | undefined,
    },
);

// 是否真相模式
const isTruthMode = computed(() => worldData.value.已进入过梦境);

// 是否梦境阶段
const isDreamPhase = computed(() => worldData.value.游戏阶段 === '梦境');

// 是否普通结局锁定状态
// 普通结局：时间循环重置，游戏锁定
const isNormalEndingLocked = computed(() => {
  const ending = store.data?.结局数据?.当前结局;
  const loopStatus = worldData.value.循环状态;
  return ending === '普通结局' && loopStatus === '结局判定';
});

// 当前场景数据
const currentSceneData = computed(() => {
  const sceneKey = `场景${currentSceneNumber.value}` as '场景1' | '场景2' | '场景3' | '场景4' | '场景5';
  return store.data?.梦境数据?.[sceneKey];
});

// 场景5数据（特殊场景：精神控制）
const scene5Data = computed(() => {
  return store.data?.梦境数据?.场景5;
});

// ============================================
// 恋爱模式专用计算属性
// ============================================

// 循环重置倒计时（小时）
const hoursUntilReset = computed(() => {
  const currentDay = worldData.value.当前天数;
  const currentHour = worldData.value.当前小时;
  const currentTotalHours = (currentDay - 1) * 24 + currentHour;
  const resetTotalHours = 4 * 24 + 7; // Day 5, 07:00 = 103小时
  return Math.max(0, resetTotalHours - currentTotalHours);
});

// 服装显示（简化格式）
const outfitDisplay = computed(() => {
  const outfit = zhaoxiaData.value.服装;
  return {
    上衣: outfit?.上衣 ?? '未知',
    下装: outfit?.下装 ?? '未知',
    内衣: outfit?.内衣 ?? '未知',
    内裤: outfit?.内裤 ?? '未知',
    袜子: outfit?.袜子 ?? '未知',
    鞋子: outfit?.鞋子 ?? '未知',
  };
});

// 亲密度（根据部位进度平均值）- 真相模式用
const intimacyLevel = computed(() => {
  const parts = zhaoxiaData.value.部位进度;
  const values = Object.values(parts);
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
});

// ============================================
// 纯爱模式专属计算属性
// ============================================

// 纯爱好感度
const pureLoveAffection = computed(() => {
  return zhaoxiaData.value.纯爱好感度 ?? 5;
});

// 纯爱亲密度
const pureLoveIntimacy = computed(() => {
  return zhaoxiaData.value.纯爱亲密度 ?? 0;
});

// 纯爱模式关系阶段（需要好感度和亲密度都达到阈值）
const pureLoveStage = computed(() => {
  const affection = pureLoveAffection.value;
  const intimacy = pureLoveIntimacy.value;
  const effectiveValue = Math.min(affection, intimacy);

  if (effectiveValue >= 80) return 5; // 羁绊（纯爱无法达到）
  if (effectiveValue >= 60) return 4; // 依恋
  if (effectiveValue >= 40) return 3; // 信任
  if (effectiveValue >= 20) return 2; // 破冰
  return 1; // 陌生
});

// 纯爱模式关系阶段名称
const pureLoveRealmName = computed(() => {
  const names = ['陌生', '破冰', '信任', '依恋', '羁绊'];
  return names[pureLoveStage.value - 1] ?? '陌生';
});

// 纯爱模式关系阶段提示
const pureLoveRealmHint = computed(() => {
  const hints = ['需要更多日常交流', '关系正在升温', '她开始信任你', '你们的关系很特别', '心意相通'];
  return hints[pureLoveStage.value - 1] ?? '';
});

// 纯爱模式关系描述
const pureLoveRelationshipText = computed(() => {
  const descriptions: Record<number, string> = {
    1: '略显生疏的母子',
    2: '关系明显亲近的母子',
    3: '亲密无间的母子',
    4: '超越母子的暧昧关系',
    5: '彼此深爱的灵魂伴侣',
  };
  return descriptions[pureLoveStage.value] ?? '普通母子';
});

// 对丈夫好感度（反向关联：60 - 亲密度 × 0.6）
const husbandAffection = computed(() => {
  const intimacy = pureLoveIntimacy.value;
  const result = Math.round(60 - intimacy * 0.6);
  return Math.max(-50, Math.min(100, result));
});

// ============================================
// 真相模式计算属性
// ============================================

// 与主角的关系描述（真相模式）
const relationshipText = computed(() => {
  const affection = zhaoxiaData.value.依存度;

  const relationships = [
    { min: 0, max: 19, text: '略显生疏的母子' },
    { min: 20, max: 39, text: '关系明显亲近的母子' },
    { min: 40, max: 59, text: '亲密无间的母子' },
    { min: 60, max: 79, text: '超越母子的暧昧关系' },
    { min: 80, max: 100, text: '彼此深爱的灵魂伴侣' },
  ];

  const found = relationships.find(r => affection >= r.min && affection <= r.max);
  return found?.text ?? '普通母子';
});

// 境界名称 - 纯爱模式伪装成母子关系修复游戏
const realmNames = {
  pure: ['陌生', '破冰', '信任', '依恋', '羁绊'],
  truth: ['初染', '迷途', '溺深', '归虚', '焚誓'],
};

const realmName = computed(() => {
  const names = isTruthMode.value ? realmNames.truth : realmNames.pure;
  return names[zhaoxiaData.value.当前境界 - 1] ?? `境界${zhaoxiaData.value.当前境界}`;
});

// 境界提示
const realmHint = computed(() => {
  const realm = zhaoxiaData.value.当前境界;
  const hints = ['需要更多日常交流', '关系正在升温', '她开始信任你', '你们的关系很特别', '心意相通'];
  return hints[realm - 1] ?? '';
});

// 真相模式境界提示（更具暗示性）
const truthRealmHint = computed(() => {
  const realm = zhaoxiaData.value.当前境界;
  const hints = [
    '身体开始有了反应...',
    '内心的防线正在动摇',
    '道德观念逐渐模糊',
    '已无法抗拒你的存在',
    '灵魂已完全属于你',
  ];
  return hints[realm - 1] ?? '';
});

// 阶段名称
const phaseNames: Record<string, string> = {
  序章: '序章',
  日常: '日常',
  梦境: '梦境中',
  结局: '结局',
};
const phaseName = computed(() => phaseNames[worldData.value.游戏阶段] ?? worldData.value.游戏阶段);

const phaseClass = computed(() => ({
  'phase-prologue': worldData.value.游戏阶段 === '序章',
  'phase-daily': worldData.value.游戏阶段 === '日常',
  'phase-dream': worldData.value.游戏阶段 === '梦境',
  'phase-ending': worldData.value.游戏阶段 === '结局',
}));

// 部位进度（真相模式）
const bodyParts = computed(() => {
  const parts = zhaoxiaData.value.部位进度;
  const names = { 嘴巴: '嘴巴认知', 胸部: '胸部认知', 下体: '下体认知', 后穴: '后穴认知', 精神: '精神认知' };

  return Object.entries(parts).map(([key, value]) => ({
    key,
    name: names[key as keyof typeof names],
    value,
  }));
});

// 梦境窗口（22:00-01:59，共4小时）
const isDreamWindowOpen = computed(() => {
  const hour = worldData.value.当前小时;
  return hour >= 22 || hour <= 1;
});

// Bug #17 修复：Day 5 或结局阶段时梦境入口被禁止
// 原因：Day 5 进入梦境会持续到 Day 6 10:00，但游戏只有5天
const isDreamBlocked = computed(() => {
  const day = worldData.value.当前天数;
  const gamePhase = worldData.value.游戏阶段;
  const loopStatus = worldData.value.循环状态;

  // Day 5 禁止进入场景1-4的梦境
  if (day === 5) return true;

  // 结局阶段禁止进入梦境
  if (gamePhase === '结局') return true;

  // 结局判定或已破解状态禁止进入梦境
  if (loopStatus === '结局判定' || loopStatus === '已破解') return true;

  return false;
});

// 距离梦境入口开启的小时数（22:00开启）
const hoursUntilDreamWindow = computed(() => {
  const hour = worldData.value.当前小时;
  // 如果已在梦境窗口内，返回0
  if (hour >= 22 || hour <= 1) {
    return 0;
  }
  // 计算距离22:00的小时数
  return 22 - hour;
});

// 苦主视角（丈夫心理活动）
// Bug 修复：删除固定模板，只使用AI生成的内容
// 真相模式下一定显示苦主视角区域，如果AI还没生成则显示等待提示
const husbandPerspective = computed(() => {
  // 优先使用AI生成的心理活动
  if (realData.value.丈夫心理活动) {
    return realData.value.丈夫心理活动;
  }
  // 如果AI还没生成，显示等待提示（真相模式下一定会显示此区域）
  return '（等待AI生成丈夫的心理活动...）';
});

// 丈夫状态
const husbandIcon = computed(() => {
  const pos = realData.value.丈夫当前位置;
  const icons: Record<string, string> = {
    客厅: '🛋️',
    卧室: '🛏️',
    书房: '📚',
    厨房: '🍳',
    外出: '🚗',
  };
  return icons[pos] ?? '👤';
});

const husbandStatusText = computed(() => {
  const pos = realData.value.丈夫当前位置;
  const texts: Record<string, string> = {
    客厅: '苏文在客厅',
    卧室: '苏文在卧室',
    书房: '苏文在书房',
    厨房: '苏文在厨房',
    外出: '苏文不在家',
  };
  return texts[pos] ?? `苏文: ${pos}`;
});

const riskClass = computed(() => {
  const sus = realData.value.丈夫怀疑度;
  if (sus >= 80) return 'risk-critical';
  if (sus >= 60) return 'risk-high';
  if (sus >= 30) return 'risk-medium';
  return 'risk-low';
});

const riskText = computed(() => {
  const sus = realData.value.丈夫怀疑度;
  if (sus >= 80) return '危险';
  if (sus >= 60) return '警惕';
  if (sus >= 30) return '注意';
  return '安全';
});

// ============================================
// 结局结算区域（Day 5, 10:00+）
// ============================================

// 结局数据
const endingData = computed(
  () =>
    store.data?.结局数据 ?? {
      当前结局: '未触发' as '未触发' | '真好结局' | '完美真爱结局' | '假好结局' | '坏结局' | '普通结局' | '纯爱结局',
      后日谈已解锁: false,
      是完美记忆路线: false,
      后日谈: {
        已触发: false,
        当前轮数: 0,
        已完成: false,
        自由模式: false,
      },
    },
);

// 是否显示结局结算区域（Day 5 且 10:00 以后，在真相模式下，但不在自由模式）
const showEndingSettlement = computed(() => {
  // 自由模式时不显示结局结算区域
  if (isInFreeMode.value) return false;

  const day = worldData.value.当前天数;
  const hour = worldData.value.当前小时;
  // Day 5, 10:00+ 时显示
  return day >= 5 && hour >= 10 && isTruthMode.value;
});

// 各场景完成状态
const sceneStatuses = computed(() => {
  const completedScenes = dreamData.value.已完成场景 ?? [];
  const correctScenes = dreamData.value.正确重构场景 ?? [];

  return [1, 2, 3, 4, 5].map(sceneNum => ({
    scene: sceneNum,
    title: SCENE_TITLES[sceneNum] ?? `场景${sceneNum}`,
    completed: completedScenes.includes(sceneNum),
    correct: correctScenes.includes(sceneNum),
  }));
});

// 已触发的结局名称
const triggeredEndingName = computed(() => {
  const ending = endingData.value.当前结局;
  const endingNames: Record<string, string> = {
    未触发: '',
    完美真爱结局: '命中注定',
    真好结局: '禁忌之爱',
    假好结局: '秘密关系',
    坏结局: '失败结局',
    普通结局: '时间循环',
  };
  return endingNames[ending] ?? ending;
});

// 距离结局结算的小时数（Day 5, 07:00 结算）
const hoursUntilEnding = computed(() => {
  const currentDay = worldData.value.当前天数;
  const currentHour = worldData.value.当前小时;
  // 结局结算时间：Day 5, 07:00
  const endingDay = 5;
  const endingHour = 7;

  if (currentDay > endingDay || (currentDay === endingDay && currentHour >= endingHour)) {
    return 0;
  }

  const currentTotalHours = (currentDay - 1) * 24 + currentHour;
  const endingTotalHours = (endingDay - 1) * 24 + endingHour;
  return endingTotalHours - currentTotalHours;
});

// 结局预测文本
const endingPredictionText = computed(() => {
  const ending = endingData.value.当前结局;

  // 如果已触发结局，直接显示结局名称
  if (ending !== '未触发') {
    const endingNames: Record<string, string> = {
      完美真爱结局: '💕 命中注定',
      真好结局: '🌸 禁忌之爱',
      假好结局: '🎭 秘密关系',
      坏结局: '💔 失败结局',
      普通结局: '🔄 时间循环',
    };
    return endingNames[ending] ?? ending;
  }

  // 未触发时，根据当前场景完成情况预测
  const completedScenes = dreamData.value.已完成场景 ?? [];
  const correctScenes = dreamData.value.正确重构场景 ?? [];
  const completedCount = completedScenes.length;
  const correctCount = correctScenes.length;

  // 检测威胁值
  const confusion = dreamData.value.记忆混乱度 ?? 0;
  const suspicion = realData.value.丈夫怀疑度 ?? 0;

  if (confusion >= 100 || suspicion >= 100) {
    return '💔 坏结局';
  }

  if (completedCount === 5) {
    if (correctCount === 5) {
      // 检查记忆连贯性来区分完美真爱和真好结局
      const memoryContinuity = dreamData.value.记忆连贯性 ?? 0;
      if (memoryContinuity === 3) {
        return '💕 完美真爱';
      }
      return '🌸 真好结局';
    } else if (correctCount > 0) {
      return '🎭 假好结局';
    } else {
      return '💔 坏结局';
    }
  }

  // 未完成全部场景
  if (completedCount === 0) {
    return '⚠️ 未开始';
  }

  return `📊 ${completedCount}/5 场景`;
});

// 结局预测样式类
const endingPredictionClass = computed(() => {
  const ending = endingData.value.当前结局;

  if (ending === '完美真爱结局') return 'perfect-ending';
  if (ending === '真好结局') return 'true-ending';
  if (ending === '假好结局') return 'false-ending';
  if (ending === '坏结局') return 'bad-ending';
  if (ending === '普通结局') return 'normal-ending';

  // 未触发时根据预测显示
  const text = endingPredictionText.value;
  if (text.includes('完美真爱') || text.includes('命中注定')) return 'perfect-ending';
  if (text.includes('真好结局') || text.includes('禁忌之爱')) return 'true-ending';
  if (text.includes('假好结局') || text.includes('秘密关系')) return 'false-ending';
  if (text.includes('坏结局') || text.includes('失败结局')) return 'bad-ending';
  if (text.includes('时间循环')) return 'normal-ending';

  return 'pending';
});

// ============================================
// 后日谈/自由模式状态
// ============================================

// 是否在后日谈进行中
const isInAfterStory = computed(() => {
  const afterStory = endingData.value.后日谈;
  return afterStory?.已触发 === true && afterStory?.已完成 !== true;
});

// 是否在自由模式
const isInFreeMode = computed(() => {
  return endingData.value.后日谈?.自由模式 === true;
});

// 后日谈进度文本
const afterStoryProgressText = computed(() => {
  if (isInAfterStory.value) {
    const round = endingData.value.后日谈?.当前轮数 ?? 1;
    return `后日谈 ${round}/2`;
  }
  return '';
});

// Bug #14 修复：后日谈/自由模式显示玩家电脑的真实日期
// 设计意图：赵霞"逃出了时间循环"，进入了玩家的现实世界
//
// Bug #18 追加修复：substitudeMacros 在 iframe 环境中可能不工作
// 改用 JavaScript 原生 Date API 获取真实日期
//
// Bug #20 修复：显示真实日期 + 游戏内时间
// - 日期：使用玩家电脑的真实日期（制造惊喜感）
// - 时间：使用游戏内的当前小时（每层楼+1小时的逻辑）
const realDateDisplay = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() 返回 0-11
  const day = now.getDate();
  // 使用游戏内的时间，而非电脑实时时间
  const gameHour = worldData.value.当前小时;
  const hours = gameHour.toString().padStart(2, '0');
  return `${year}年${month}月${day}日, ${hours}:00`;
});

// 是否应该显示真实日期
// Bug #14 修复：Day 5 23:00 跳到 Day 6 00:00 时，状态栏切换为显示真实日期
// 设计意图：赵霞"逃出了时间循环"，进入了玩家的现实世界
const shouldShowRealDate = computed(() => {
  const day = worldData.value.当前天数;
  // Day 6+ 时显示真实日期（即 Day 5 23:00 → Day 6 00:00 后）
  if (day > 5) return true;
  // 或者好结局已触发且在后日谈/自由模式
  const ending = endingData.value.当前结局;
  const isGoodEnding = ending === '完美真爱结局' || ending === '真好结局' || ending === '假好结局';
  const isInAfterStoryOrFreeMode = isInAfterStory.value || isInFreeMode.value;
  return isGoodEnding && isInAfterStoryOrFreeMode;
});

// 结局类型中文名
const endingTypeName = computed(() => {
  const ending = endingData.value.当前结局;
  const names: Record<string, string> = {
    完美真爱结局: '命中注定',
    真好结局: '禁忌之爱',
    假好结局: '秘密关系',
  };
  return names[ending] ?? ending;
});

// Bug #16 修复：是否应该显示后日谈界面
// 只在后日谈进行中显示后日谈界面，自由模式恢复到真相模式界面
const showAfterStoryMode = computed(() => {
  return isInAfterStory.value;
});

// 后日谈苏文状态描述
const afterStoryHusbandStatus = computed(() => {
  const ending = endingData.value.当前结局;
  switch (ending) {
    case '完美真爱结局':
      return '苏文已经接受了一切，成为了这个家庭的"苦主"';
    case '真好结局':
      return '苏文因"头孢+酒"反应成为植物人，永远无法醒来';
    case '假好结局':
      return '苏文在家，对妻子和儿子的关系有所怀疑';
    default:
      return '苏文状态未知';
  }
});

// ============================================
// 梦境部位选择相关逻辑
// ============================================

// 当前场景编号（判断这个楼层所在的场景）
const currentSceneNumber = computed(() => {
  // 只有梦境阶段才有场景编号
  if (!isDreamPhase.value) {
    return 0; // 非梦境阶段返回0，表示没有场景
  }

  const currentHour = worldData.value.当前小时;
  const scene5Data = store.data?.梦境数据?.场景5;

  // Bug #012 修复：场景5入口状态栏错误显示为场景1
  // 原因：场景5的判断只依赖 scene5Data?.已进入，但在某些情况下数据同步延迟
  // 解决方案：添加多个判断条件
  // 1. 优先检查 scene5Data.已进入（最准确）
  // 2. 如果在白天（8:00-19:59）进入梦境，也判断为场景5
  //    因为场景1-4都是夜间22:00后进入，白天进入的只能是场景5（安眠药）

  // 条件1：明确标记已进入场景5
  if (scene5Data?.已进入 && currentHour >= 8 && currentHour < 20) {
    return 5;
  }

  // 条件2：白天进入梦境，隐含为场景5（即使 已进入 标记尚未同步）
  // 场景1-4入口时间是 22:00（晚上），场景5入口时间是 08:00-19:59（白天）
  // 如果当前时间是白天且处于梦境阶段，那肯定是场景5
  // 如果入口时间或当前时间在白天范围（8:00-19:59），判断为场景5
  // 这处理了数据同步延迟导致 已进入 尚未设置的情况
  if (currentHour >= 8 && currentHour < 20) {
    // 额外检查：确认不是场景1-4跨夜到白天的情况
    // 场景1-4在夜间进入后可能跨夜到早上（如 22:00 入→ 10:00 出），此时时间虽然是白天但仍是场景1-4
    // 判断方法：检查 _梦境入口天数 是否存在，如果存在说明是正常入口，看入口时间
    const entryDay = worldData.value._梦境入口天数;
    if (entryDay !== undefined) {
      // 有入口天数记录，检查是否是场景5的入口模式
      // 场景5特征：进入时间一定是白天（8:00-19:59）
      // 场景1-4特征：进入时间一定是夜间（22:00）
      // 由于我们在白天，需要判断是"场景5刚进入"还是"场景1-4跨夜"
      //
      // 检查 scene5Data 的存在：如果有 scene5Data 说明玩家曾尝试进入场景5
      // 即使 已进入 尚未同步，有 scene5Data 结构就说明脚本开始处理场景5入口
      if (scene5Data !== undefined) {
        return 5;
      }
    }
  }

  // 场景1-4判断：梦境阶段
  // Bug #17 修复：使用 _梦境入口天数 而非 当前天数
  // 原因：梦境期间时间会继续推进（如 Day 1 22:00 进入，到 Day 2 00:00 时跨天），
  // 使用当前天数会导致场景编号在梦境中途变化（例如场景1变成场景2）
  // Day 1 = 场景1, Day 2 = 场景2, Day 3 = 场景3, Day 4+ = 场景4
  //
  // Bug #18 修复：移除时间窗口检查
  // 原因：如果玩家在01:00时还在梦境中，时间推进到02:00后，
  // 原代码因为02:00不在22:00-01:59窗口而返回0，导致显示"未知场景"
  // 实际上玩家仍在梦境中，应该继续显示正确的场景编号
  const day = worldData.value._梦境入口天数 ?? worldData.value.当前天数;
  return Math.min(day, 4);
});

// 是否显示选择遮罩层
// 核心逻辑：游戏阶段为梦境 + 选择未锁定
// 确认选择后立即消失，ROLL时脚本会重置锁定状态
const showSelectionOverlay = computed(() => {
  // 必须在梦境阶段
  if (worldData.value.游戏阶段 !== '梦境') {
    return false;
  }

  // 选择已锁定则不显示遮罩层（玩家已确认选择）
  if (worldData.value.梦境选择已锁定) {
    return false;
  }

  return true;
});

// 可选择的部位列表（场景5有精神选项，其他场景没有）
const selectableParts = computed(() => {
  const baseParts = [
    { key: '嘴巴', name: '嘴巴' },
    { key: '胸部', name: '胸部' },
    { key: '下体', name: '下体' },
    { key: '后穴', name: '后穴' },
  ];

  // 场景5 添加精神选项
  if (currentSceneNumber.value === 5) {
    baseParts.push({ key: '精神', name: '精神' });
  }

  return baseParts;
});

// 切换部位选择
function togglePartSelection(partKey: string) {
  const index = selectedParts.value.indexOf(partKey);
  if (index === -1) {
    selectedParts.value.push(partKey);
  } else {
    selectedParts.value.splice(index, 1);
  }
}

// 确认选择并写入变量
function confirmSelection() {
  if (selectedParts.value.length === 0) {
    return;
  }

  if (!store.data) {
    console.error('[梦境选择] store.data 不存在');
    return;
  }

  const sceneKey = `场景${currentSceneNumber.value}` as '场景1' | '场景2' | '场景3' | '场景4' | '场景5';

  // Bug #39 修复：对选择进行去重处理，防止重复部位
  const uniqueParts = [...new Set(selectedParts.value)];

  // 初始化场景数据（如果不存在）
  if (!store.data.梦境数据[sceneKey]) {
    store.data.梦境数据[sceneKey] = {
      已进入: true,
      选择部位: uniqueParts,
      进入时间: worldData.value.时间,
      对话轮数: 0,
    };
  } else {
    store.data.梦境数据[sceneKey]!.选择部位 = uniqueParts;
    store.data.梦境数据[sceneKey]!.已进入 = true;
    store.data.梦境数据[sceneKey]!.进入时间 = worldData.value.时间;
  }

  // 标记选择已锁定 - 遮罩层立即消失
  store.data.世界.梦境选择已锁定 = true;

  // 首次进入梦境，切换到真相模式并初始化依存度和道德底线
  if (!store.data.世界.已进入过梦境) {
    store.data.世界.已进入过梦境 = true;

    // D7设计：首次进入梦境时，根据纯爱模式的好感度和亲密度初始化真相模式数值
    const 好感度 = zhaoxiaData.value.纯爱好感度 ?? 0;
    const 亲密度 = zhaoxiaData.value.纯爱亲密度 ?? 0;

    // 计算初始依存度：好感度×0.2 + 亲密度×0.1，上限30
    const rawDependence = 好感度 * 0.2 + 亲密度 * 0.1;
    const initialDependence = Math.min(30, Math.max(0, Math.floor(rawDependence)));

    // 计算初始道德底线：80 - 亲密度×0.2，下限60
    const rawMorality = 80 - 亲密度 * 0.2;
    const initialMorality = Math.min(80, Math.max(60, Math.floor(rawMorality)));

    store.data!.赵霞状态.依存度 = initialDependence;
    store.data!.赵霞状态.道德底线 = initialMorality;

    console.info(
      `[梦境初始化] 好感度=${好感度}, 亲密度=${亲密度} → 依存度=${initialDependence}, 道德底线=${initialMorality}`,
    );
  }

  console.info(`[梦境选择] 场景${currentSceneNumber.value} 选择部位: ${selectedParts.value.join(', ')}`);
}

// 监听梦境锁定状态变化，用于支持ROLL
// 当脚本重置锁定状态时（ROLL操作），清空本地选择
watch(
  () => worldData.value.梦境选择已锁定,
  locked => {
    if (!locked) {
      // 锁定被重置（可能是ROLL操作），清空本地选择状态
      selectedParts.value = [];
    }
  },
);
</script>

<style lang="scss" scoped>
@use 'sass:color';

// ========== 配色系统 ==========
$c-bg: #0d0d0d;
$c-panel: rgba(18, 18, 18, 0.98);
$c-gold: #d4af37;
$c-gold-dim: #8a7326;
$c-purple: #8a2be2;
$c-purple-dim: #5a1d8a;
$c-pink: #ff6b9d;
$c-pink-light: #ffb6c1; // 浅粉色
$c-pink-soft: #ffc0cb; // 更浅的粉色
$c-rose: #e8a0b0; // 玫瑰粉
$c-red: #8a1c1c;
$c-text: #e0e0e0;
$c-text-sub: #888;
$c-green: #4caf50;
$c-blue: #5dade2;
$c-orange: #f39c12;
$c-danger: #e74c3c;
$font-serif: 'Noto Serif SC', 'Songti SC', 'STSong', 'Microsoft YaHei', serif;
$font-sans: 'Microsoft YaHei', 'Roboto', sans-serif;

// ========== 容器 ==========
.mystic-container {
  position: relative;
  width: 100%;
  font-family: $font-sans;
  color: $c-text;
  background: $c-bg;
  overflow: hidden;

  // Bug #18 修复：加载状态样式
  &.loading-state {
    .loading-content {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      min-height: 100px;

      .loading-text {
        color: $c-text-sub;
        font-size: 14px;
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }
}

// Bug #18 修复：加载动画
@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

// ========== 背景纹理 ==========
.bg-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    // 默认背景

    radial-gradient(ellipse at 20% 0%, rgba($c-purple, 0.1), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba($c-purple, 0.08), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba($c-gold, 0.03), transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.02) 1px,
      rgba(255, 255, 255, 0.02) 2px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.02) 1px,
      rgba(255, 255, 255, 0.02) 2px
    );
  z-index: 0;
}

// 恋爱模式：浅粉色温馨主题
.romance-mode .bg-pattern {
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba($c-pink-light, 0.12), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba($c-rose, 0.1), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba($c-pink-soft, 0.05), transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(255, 200, 200, 0.02) 1px,
      rgba(255, 200, 200, 0.02) 2px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1px,
      rgba(255, 200, 200, 0.02) 1px,
      rgba(255, 200, 200, 0.02) 2px
    );
}

// 梦境模式：神秘紫色主题
.dream-mode .bg-pattern {
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba($c-purple, 0.15), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba($c-purple-dim, 0.12), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.08), transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(138, 43, 226, 0.03) 1px,
      rgba(138, 43, 226, 0.03) 2px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1px,
      rgba(138, 43, 226, 0.03) 1px,
      rgba(138, 43, 226, 0.03) 2px
    );
}

// 真相模式：暗红色主题
.truth-mode .bg-pattern {
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba($c-red, 0.12), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba($c-pink, 0.1), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba($c-gold, 0.04), transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.025) 1px,
      rgba(255, 255, 255, 0.025) 2px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1px,
      rgba(255, 255, 255, 0.025) 1px,
      rgba(255, 255, 255, 0.025) 2px
    );
}

// 后日谈/自由模式：金色温馨主题
.after-story-mode .bg-pattern {
  background-image:
    radial-gradient(ellipse at 20% 0%, rgba($c-gold, 0.15), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba($c-pink, 0.12), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.08), transparent 60%),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(255, 215, 0, 0.03) 1px,
      rgba(255, 215, 0, 0.03) 2px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 1px,
      rgba(255, 215, 0, 0.03) 1px,
      rgba(255, 215, 0, 0.03) 2px
    );
}

// ========== 主面板 ==========
.main-panel {
  position: relative;
  z-index: 1;
  padding: 14px 16px;
  background: $c-panel;
  border: 1px solid rgba($c-gold, 0.12);
  backdrop-filter: blur(5px);
}

.romance-mode .main-panel {
  border-color: rgba($c-pink-light, 0.2);
}

.dream-mode .main-panel {
  border-color: rgba($c-purple, 0.25);
}

.truth-mode .main-panel {
  border-color: rgba($c-pink, 0.15);
}

// ========== 装饰线 ==========
.panel-decor {
  position: absolute;
  left: 15px;
  right: 15px;
  height: 1px;
  background: linear-gradient(90deg, transparent, $c-gold-dim, transparent);
  opacity: 0.4;

  &.top {
    top: 6px;
  }

  &.bottom {
    bottom: 6px;
  }
}

.romance-mode .panel-decor {
  background: linear-gradient(90deg, transparent, $c-pink-light, transparent);
  opacity: 0.35;
}

.dream-mode .panel-decor {
  background: linear-gradient(90deg, transparent, $c-purple, transparent);
  opacity: 0.4;
}

.truth-mode .panel-decor {
  background: linear-gradient(90deg, transparent, $c-pink, transparent);
  opacity: 0.3;
}

.after-story-mode .panel-decor {
  background: linear-gradient(90deg, transparent, $c-gold, transparent);
  opacity: 0.4;
}

.after-story-mode .main-panel {
  border-color: rgba($c-gold, 0.25);
}

// ========== 头部 ==========
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba($c-gold, 0.15);
}

.romance-mode .header {
  border-bottom-color: rgba($c-pink-light, 0.2);
}

.dream-mode .header {
  border-bottom-color: rgba($c-purple, 0.2);
}

.truth-mode .header {
  border-bottom-color: rgba($c-pink, 0.15);
}

.world-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.info-item {
  font-size: 0.85em;
  color: $c-text;

  .icon {
    margin-right: 4px;
    font-style: normal;
  }

  &.loop {
    color: $c-text-sub;
    font-size: 0.8em;
  }

  &.time-display {
    font-weight: bold;
  }

  &.countdown {
    color: $c-blue;
    font-size: 0.8em;

    &.urgent {
      color: $c-orange;
      animation: pulse-urgent 1.5s ease-in-out infinite;
    }
  }
}

@keyframes pulse-urgent {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.divider {
  color: rgba($c-gold, 0.4);
  font-size: 0.7em;
}

.romance-mode .divider {
  color: rgba($c-pink-light, 0.5);
}

.dream-mode .divider {
  color: rgba($c-purple, 0.5);
}

.truth-mode .divider {
  color: rgba($c-pink, 0.4);
}

.phase-tag {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.75em;
  background: rgba($c-purple, 0.2);
  color: lighten($c-purple, 30%);

  &.phase-dream {
    background: rgba($c-purple, 0.35);
    color: #dda0dd;
  }

  &.phase-ending {
    background: rgba(255, 69, 0, 0.25);
    color: #ffa07a;
  }

  &.phase-after-story {
    background: rgba($c-gold, 0.35);
    color: #ffd700;
  }
}

.mode-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75em;
  font-family: $font-serif;
  letter-spacing: 1px;
  background: rgba($c-purple, 0.15);
  color: lighten($c-purple, 25%);
  border: 1px solid rgba($c-purple, 0.25);

  &.dream {
    background: rgba($c-purple, 0.2);
    color: #dda0dd;
    border-color: rgba($c-purple, 0.4);
    text-shadow: 0 0 8px rgba($c-purple, 0.4);
    animation: glow-dream 2s ease-in-out infinite;
  }

  &.truth {
    background: rgba($c-pink, 0.15);
    color: $c-pink;
    border-color: rgba($c-pink, 0.3);
    text-shadow: 0 0 8px rgba($c-pink, 0.3);
  }
}

@keyframes glow-dream {
  0%,
  100% {
    box-shadow: 0 0 4px rgba($c-purple, 0.3);
  }
  50% {
    box-shadow: 0 0 10px rgba($c-purple, 0.5);
  }
}

// ========== 恋爱模式专用样式（浅粉色主题） ==========

// 角色区块
.character-section {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: rgba(255, 200, 200, 0.04);
  border-radius: 8px;
  border-left: 3px solid $c-pink-light;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 0.9em;

  .location-icon {
    font-size: 1em;
  }

  .location-text {
    color: $c-text-sub;

    .highlight {
      color: $c-pink-light;
      font-weight: bold;
    }
  }
}

.thought-bubble {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 10px;
  background: rgba($c-pink-light, 0.08);
  border-radius: 6px;
  font-size: 0.85em;

  .thought-icon {
    font-size: 1em;
    flex-shrink: 0;
  }

  .thought-text {
    color: $c-text;
    font-style: italic;
    line-height: 1.4;
  }
}

// 服装区块
.outfit-section {
  margin-bottom: 12px;
}

.outfit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.outfit-item {
  background: rgba(255, 200, 200, 0.04);
  border: 1px solid rgba($c-pink-light, 0.1);
  padding: 6px 8px;
  border-radius: 6px;
  text-align: center;

  .outfit-label {
    display: block;
    font-size: 0.65em;
    color: $c-rose;
    margin-bottom: 2px;
  }

  .outfit-value {
    display: block;
    font-size: 0.7em;
    color: $c-text;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  // 改造项（真相模式专属）
  .outfit-item.modification {
    grid-column: 1 / -1; // 跨越整行
    background: linear-gradient(135deg, rgba(180, 50, 80, 0.15), rgba(120, 30, 60, 0.1));
    border: 1px solid rgba(180, 50, 80, 0.3);
    padding: 8px 10px;

    .outfit-label {
      color: #d44;
      font-weight: 600;
    }

    .modification-list {
      color: #e88;
      font-size: 0.75em;
      -webkit-line-clamp: 3; // 允许更多行
    }
  }
}

// 真相模式装扮区块
.truth-outfit {
  margin: 12px 0;
  border-top: 1px solid rgba(180, 50, 80, 0.2);
  padding-top: 12px;
}

// 统计区块
.stats-section {
  margin-bottom: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: stretch; // 确保两列等高
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 8px;

  // 让第一个子元素（卡片）自动伸展填充
  > :first-child {
    flex: 1;
  }
}

// 关系卡片（恋爱模式浅粉色）
.relationship-card {
  background: linear-gradient(135deg, rgba($c-pink-light, 0.12), rgba($c-rose, 0.08));
  border: 1px solid rgba($c-pink-light, 0.2);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .relation-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 6px;

    .relation-icon {
      font-size: 1em;
    }

    .relation-title {
      font-size: 0.75em;
      color: $c-text-sub;
    }
  }

  .relation-value {
    font-size: 0.9em;
    font-weight: bold;
    color: $c-pink-light;
    font-family: $font-serif;
  }
}

// 境界卡片
.realm-card {
  background: linear-gradient(135deg, rgba($c-gold, 0.1), rgba($c-gold-dim, 0.08));
  border: 1px solid rgba($c-gold, 0.2);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .realm-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-bottom: 4px;

    .realm-icon {
      font-size: 1em;
    }

    .realm-title {
      font-size: 0.75em;
      color: $c-text-sub;
    }
  }

  .realm-value {
    font-size: 1em;
    font-weight: bold;
    color: $c-gold;
    font-family: $font-serif;
    margin-bottom: 6px;
  }

  .realm-progress {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 4px;

    .realm-bar {
      height: 100%;
      background: linear-gradient(90deg, $c-gold-dim, $c-gold);
      border-radius: 2px;
      transition: width 0.4s ease;
    }
  }

  .realm-hint {
    font-size: 0.65em;
    color: $c-text-sub;
  }
}

// 丈夫状态行
.husband-status {
  margin-bottom: 8px;
}

.husband-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba($c-gold, 0.08);

  .husband-icon {
    font-size: 1.1em;
  }

  .husband-text {
    flex: 1;
    font-size: 0.85em;
    color: $c-text-sub;
  }
}

// 后日谈信息区域
.after-story-info {
  margin: 12px 0;

  .info-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba($c-gold, 0.08);
    border-radius: 8px;
    border: 1px solid rgba($c-gold, 0.2);

    .info-icon {
      font-size: 1.5em;
    }

    .info-content {
      flex: 1;

      .info-title {
        font-size: 0.9em;
        font-weight: 500;
        color: $c-gold;
        margin-bottom: 2px;
      }

      .info-desc {
        font-size: 0.8em;
        color: $c-text-sub;
      }
    }
  }
}

.after-story-husband {
  .husband-row {
    border-color: rgba($c-gold, 0.15);
    background: rgba($c-gold, 0.05);
  }
}

// ========== 区块标题 ==========
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 10px;

  &.compact {
    margin-bottom: 8px;
  }

  .title-text {
    color: $c-gold;
    font-size: 0.8em;
    font-family: $font-serif;
    letter-spacing: 2px;
    text-shadow: 0 0 6px rgba($c-gold, 0.25);
  }

  .decor-line {
    flex: 1;
    height: 1px;
    max-width: 40px;
    background: linear-gradient(90deg, transparent, $c-gold-dim, transparent);
    opacity: 0.5;
  }
}

.romance-mode .section-title {
  .title-text {
    color: $c-pink-light;
    text-shadow: 0 0 6px rgba($c-pink-light, 0.2);
  }

  .decor-line {
    background: linear-gradient(90deg, transparent, $c-pink-light, transparent);
    opacity: 0.4;
  }
}

.dream-mode .section-title {
  .title-text {
    color: #dda0dd;
    text-shadow: 0 0 8px rgba($c-purple, 0.35);
  }

  .decor-line {
    background: linear-gradient(90deg, transparent, $c-purple, transparent);
    opacity: 0.5;
  }
}

.truth-mode .section-title {
  .title-text {
    color: $c-pink;
    text-shadow: 0 0 6px rgba($c-pink, 0.25);
  }

  .decor-line {
    background: linear-gradient(90deg, transparent, $c-pink, transparent);
    opacity: 0.4;
  }
}

// ========== 统计项 ==========
.stat-item {
  margin-bottom: 6px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  font-size: 0.8em;

  .name {
    color: $c-text-sub;
  }

  .num {
    color: #fff;
    font-weight: bold;

    &.danger {
      color: #ff4757;
      text-shadow: 0 0 6px rgba(255, 71, 87, 0.4);
    }
  }
}

.progress-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;

  &.affection {
    background: linear-gradient(90deg, #ff6b9d, #ff4757);
  }

  &.intimacy {
    background: linear-gradient(90deg, $c-purple, lighten($c-purple, 15%));
  }

  &.desire {
    background: linear-gradient(90deg, $c-pink, darken($c-pink, 15%));
  }

  &.moral {
    background: linear-gradient(90deg, $c-green, darken($c-green, 10%));
  }

  &.husband {
    background: linear-gradient(90deg, #74b9ff, #0984e3);
  }

  &.chaos {
    background: linear-gradient(90deg, #a55eea, #8854d0);
  }

  &.suspicion {
    background: linear-gradient(90deg, #ff7675, #d63031);
  }
}

// ========== 风险标签 ==========
.risk-badge {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 0.7em;
  font-weight: bold;

  &.risk-low {
    background: rgba($c-green, 0.2);
    color: $c-green;
  }

  &.risk-medium {
    background: rgba(241, 196, 15, 0.2);
    color: #f1c40f;
  }

  &.risk-high {
    background: rgba(230, 126, 34, 0.2);
    color: #e67e22;
  }

  &.risk-critical {
    background: rgba(231, 76, 60, 0.25);
    color: #ff4757;
    animation: pulse-danger 1.5s ease-in-out infinite;
  }
}

@keyframes pulse-danger {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// ========== 真相模式：主状态区域 ==========
.status-display {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
}

.col-left {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.col-right {
  flex: 1;
  min-width: 0;
}

// ========== 境界圆环 ==========
.stage-card {
  text-align: center;
}

.stage-ring {
  position: relative;
  width: 80px;
  height: 80px;
}

.circular-chart {
  width: 100%;
  height: 100%;
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: $c-purple;
  stroke-width: 3;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dasharray 0.5s ease;
  filter: drop-shadow(0 0 4px rgba($c-purple, 0.5));
}

.truth-mode .circle {
  stroke: $c-pink;
  filter: drop-shadow(0 0 4px rgba($c-pink, 0.5));
}

.stage-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  .label {
    display: block;
    font-size: 0.65em;
    color: $c-text-sub;
    margin-bottom: 2px;
  }

  .value {
    display: block;
    font-size: 0.8em;
    font-weight: bold;
    font-family: $font-serif;
    color: #fff;
  }
}

// ========== 核心数值组 ==========
.stats-group {
  width: 100%;
}

// ========== 部位进度 ==========
.body-section {
  margin-bottom: 12px;
}

.body-grid-container {
  position: relative;
}

.body-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  transition: all 0.3s;

  &.dimmed {
    opacity: 0.25;
    filter: blur(2px);
    pointer-events: none;
  }
}

.body-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba($c-gold, 0.08);
  padding: 6px 4px;
  border-radius: 6px;
  text-align: center;
}

.truth-mode .body-item {
  border-color: rgba($c-pink, 0.1);
}

.part-name {
  display: block;
  font-size: 0.65em;
  color: $c-text-sub;
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  margin-bottom: 2px;
}

.mini-bar {
  height: 100%;
  background: $c-purple;
  border-radius: 2px;
  transition: width 0.3s;
}

.truth-mode .mini-bar {
  background: $c-pink;
}

.part-value {
  font-size: 0.7em;
  color: #fff;
}

// ========== 选择遮罩层 ==========
.selection-overlay {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: linear-gradient(135deg, rgba($c-purple, 0.2), rgba($c-purple-dim, 0.25));
  border: 1px solid rgba($c-purple, 0.4);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(4px);
  z-index: 10;
}

.selection-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.selection-icon {
  font-size: 1.1em;
}

.selection-title {
  font-size: 0.85em;
  font-weight: bold;
  font-family: $font-serif;
  color: #dda0dd;
  letter-spacing: 1px;
}

.selection-hint {
  font-size: 0.7em;
  color: $c-text-sub;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  width: 100%;
}

.selection-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba($c-gold, 0.1);
  border-left: 2px solid $c-gold-dim;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    background: rgba($c-purple, 0.15);
    border-color: rgba($c-purple, 0.35);
    border-left-color: $c-purple;
  }

  &.selected {
    background: rgba($c-purple, 0.3);
    border-color: rgba($c-purple, 0.5);
    border-left-color: lighten($c-purple, 20%);
  }
}

.selection-checkbox {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.selection-item.selected .selection-checkbox {
  background: $c-purple;
  border-color: $c-purple;
}

.check-mark {
  color: #fff;
  font-size: 0.7em;
  font-weight: bold;
}

.selection-part-name {
  font-size: 0.8em;
  color: $c-text;
}

.confirm-button {
  margin-top: 4px;
  padding: 6px 20px;
  background: linear-gradient(135deg, $c-purple, $c-purple-dim);
  border: none;
  border-radius: 16px;
  color: #fff;
  font-size: 0.8em;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.25s;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, lighten($c-purple, 8%), $c-purple);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($c-purple, 0.35);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

// ========== 威胁区域 ==========
.threat-section {
  margin-top: 12px;
}

.threat-item {
  margin-bottom: 8px;
}

.threat-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  font-size: 0.8em;

  .name {
    color: $c-text-sub;
  }

  .num {
    color: #fff;

    &.danger {
      color: #ff4757;
      font-weight: bold;
      text-shadow: 0 0 6px rgba(255, 71, 87, 0.4);
    }
  }
}

// ========== 苏文卡片 ==========
.husband-card-section {
  margin-bottom: 12px;
}

.husband-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba($c-gold, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-icon {
  font-size: 1.1em;
}

.card-title {
  font-size: 0.8em;
  font-family: $font-serif;
  color: $c-gold;
  letter-spacing: 1px;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-text {
  font-size: 0.85em;
  color: $c-text-sub;
}

// ========== 梦境提示 ==========
.dream-hint {
  margin-bottom: 12px;
}

.hint-card {
  background: linear-gradient(135deg, rgba($c-purple, 0.15), rgba($c-purple-dim, 0.2));
  border: 1px solid rgba($c-purple, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  animation: glow-hint 2s ease-in-out infinite;
}

@keyframes glow-hint {
  0%,
  100% {
    box-shadow: 0 0 0 rgba($c-purple, 0);
  }
  50% {
    box-shadow: 0 0 12px rgba($c-purple, 0.25);
  }
}

.hint-icon {
  font-size: 1.1em;
}

.hint-text {
  font-size: 0.85em;
  font-family: $font-serif;
  color: #dda0dd;
  letter-spacing: 1px;
}

.hint-time {
  font-size: 0.75em;
  color: $c-text-sub;
}

// ========== 场景进度 ==========
.scene-section {
  margin-bottom: 8px;
}

.scene-progress {
  text-align: center;
}

.scene-grid {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.scene-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;

  .scene-num {
    font-size: 0.75em;
    color: #555;
  }

  &.completed {
    background: rgba($c-purple, 0.3);
    border-color: rgba($c-purple, 0.5);

    .scene-num {
      color: #dda0dd;
    }
  }

  &.correct {
    background: rgba($c-green, 0.25);
    border: 2px solid $c-green;
    box-shadow: 0 0 8px rgba($c-green, 0.3);

    .scene-num {
      color: $c-green;
      font-weight: bold;
    }
  }
}

.scene-stats {
  font-size: 0.7em;
  color: $c-text-sub;
  display: flex;
  justify-content: center;
  gap: 8px;

  .divider {
    color: rgba(255, 255, 255, 0.2);
  }

  .correct-count {
    color: $c-green;
  }
}

// ========== 梦境模式专用样式 ==========

// 梦境场景信息
.dream-scene-info {
  margin-bottom: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba($c-purple, 0.15), rgba($c-purple-dim, 0.1));
  border: 1px solid rgba($c-purple, 0.3);
  border-radius: 10px;
  text-align: center;

  .scene-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;

    .scene-icon {
      font-size: 1.2em;
    }

    .scene-title {
      font-size: 1em;
      font-weight: bold;
      font-family: $font-serif;
      color: #dda0dd;
      letter-spacing: 2px;
    }
  }

  .scene-status {
    font-size: 0.85em;

    .status-label {
      color: $c-text-sub;
      margin-right: 6px;
    }

    .status-value {
      color: lighten($c-purple, 25%);
      font-weight: bold;
    }
  }
}

// 梦境布局调整
.dream-layout {
  margin-bottom: 10px;
}

// 当晚进度区域
.tonight-progress {
  margin-bottom: 12px;
}

.tonight-grid {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.tonight-item {
  background: rgba($c-purple, 0.1);
  border: 1px solid rgba($c-purple, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  .tonight-label {
    font-size: 0.7em;
    color: $c-text-sub;
  }

  .tonight-value {
    font-size: 0.75em;
    font-weight: bold;
    color: lighten($c-purple, 20%);

    &.at-limit {
      color: $c-orange;
      text-shadow: 0 0 4px rgba($c-orange, 0.4);
    }
  }
}

.tonight-hint {
  text-align: center;
  font-size: 0.65em;
  color: $c-text-sub;
}

// 当前场景高亮
.scene-dot.current {
  border: 2px solid $c-purple;
  box-shadow: 0 0 10px rgba($c-purple, 0.5);
  animation: pulse-current 1.5s ease-in-out infinite;

  .scene-num {
    color: #dda0dd;
    font-weight: bold;
  }
}

@keyframes pulse-current {
  0%,
  100% {
    box-shadow: 0 0 6px rgba($c-purple, 0.4);
  }
  50% {
    box-shadow: 0 0 14px rgba($c-purple, 0.7);
  }
}

// 梦境模式进度条颜色
.dream-mode .progress-bar {
  &.desire {
    background: linear-gradient(90deg, $c-purple, lighten($c-purple, 15%));
  }
}

// ========== 底部记忆稳定度进度条 ==========
.memory-stability-section {
  margin-top: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, rgba($c-purple, 0.12), rgba($c-purple-dim, 0.08));
  border: 1px solid rgba($c-purple, 0.25);
  border-radius: 10px;

  .stability-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;

    .stability-icon {
      font-size: 1.1em;
    }

    .stability-title {
      font-size: 0.9em;
      font-weight: bold;
      color: lighten($c-purple, 25%);
      letter-spacing: 1px;
    }

    .stability-value {
      font-size: 1em;
      font-weight: bold;
      color: #dda0dd;
      margin-left: auto;
    }

    .stability-time {
      font-size: 0.8em;
      color: $c-text-sub;
      opacity: 0.8;
    }
  }

  .stability-progress-track {
    height: 12px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .stability-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, $c-purple, lighten($c-purple, 20%), #dda0dd);
    border-radius: 6px;
    transition: width 0.5s ease;
    box-shadow: 0 0 8px rgba($c-purple, 0.5);
    animation: stability-glow 2s ease-in-out infinite;

    &.suggestion {
      background: linear-gradient(90deg, #9b59b6, #8e44ad, #d7bde2);
    }
  }
}

@keyframes stability-glow {
  0%,
  100% {
    box-shadow: 0 0 6px rgba($c-purple, 0.4);
  }
  50% {
    box-shadow: 0 0 12px rgba($c-purple, 0.7);
  }
}

.dream-mode .mini-bar {
  background: $c-purple;
}

// 丈夫状态行（恋爱模式浅粉色）
.romance-mode .husband-row {
  border-color: rgba($c-pink-light, 0.12);
  background: rgba(255, 200, 200, 0.03);
}

// ========== 场景5专用样式（精神控制特殊场景） ==========
.dream-scene-info.scene-5 {
  background: linear-gradient(135deg, rgba(#9b59b6, 0.2), rgba(#8e44ad, 0.15));
  border-color: rgba(#9b59b6, 0.4);

  .scene-header .scene-title {
    color: #d7bde2;
    text-shadow: 0 0 10px rgba(#9b59b6, 0.5);
  }
}

.scene5-progress {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba($c-purple, 0.25);

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .progress-label {
      font-size: 0.8em;
      color: $c-text-sub;
    }

    .progress-value {
      font-size: 0.85em;
      font-weight: bold;
      color: #d7bde2;
    }
  }

  .progress-track.scene5 {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 8px;

    .progress-bar.scene5 {
      height: 100%;
      background: linear-gradient(90deg, #9b59b6, #e74c3c);
      border-radius: 3px;
      transition: width 0.4s ease;
    }
  }

  .completion-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 0.8em;

    .completion-label {
      color: $c-text-sub;
    }

    .completion-value {
      font-weight: bold;
      color: #d7bde2;

      &.high {
        color: #e74c3c;
        text-shadow: 0 0 6px rgba(#e74c3c, 0.4);
      }
    }

    .special-ending-hint {
      font-size: 0.85em;
      color: #f1c40f;
      animation: glow-special 1.5s ease-in-out infinite;
    }
  }
}

@keyframes glow-special {
  0%,
  100% {
    text-shadow: 0 0 4px rgba(#f1c40f, 0.3);
  }
  50% {
    text-shadow: 0 0 10px rgba(#f1c40f, 0.6);
  }
}

// 场景5的场景点特殊样式
.scene-dot:nth-child(5) {
  &.completed {
    background: linear-gradient(135deg, rgba(#9b59b6, 0.3), rgba(#e74c3c, 0.25));
    border-color: #9b59b6;
  }

  &.current {
    border-color: #9b59b6;
    box-shadow: 0 0 12px rgba(#9b59b6, 0.6);
    background: linear-gradient(135deg, rgba(#9b59b6, 0.25), rgba(#e74c3c, 0.15));

    .scene-num {
      color: #d7bde2;
    }
  }
}

// ========== 梦境模式新UI样式 ==========

// 赵霞记忆状态卡片
.dream-character-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, rgba($c-purple, 0.15), rgba($c-purple-dim, 0.1));
  border: 1px solid rgba($c-purple, 0.3);
  border-radius: 10px;

  .character-avatar {
    position: relative;
    flex-shrink: 0;

    .avatar-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      font-size: 1.8em;
      background: rgba($c-purple, 0.2);
      border-radius: 50%;
      border: 2px solid rgba($c-purple, 0.4);
    }

    .age-badge {
      position: absolute;
      bottom: -4px;
      right: -4px;
      display: flex;
      align-items: baseline;
      gap: 1px;
      padding: 2px 6px;
      background: linear-gradient(135deg, $c-purple, $c-purple-dim);
      border-radius: 8px;
      font-size: 0.65em;

      .age-value {
        font-weight: bold;
        color: #fff;
      }

      .age-label {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.85em;
      }
    }
  }

  .character-info {
    flex: 1;
    min-width: 0;

    .character-name {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .name-text {
        font-size: 1.1em;
        font-weight: bold;
        font-family: $font-serif;
        color: #dda0dd;
      }

      .memory-tag {
        font-size: 0.65em;
        padding: 2px 6px;
        background: rgba($c-purple, 0.3);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .dream-thought {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      border-left: 2px solid rgba($c-purple, 0.5);

      .thought-icon {
        flex-shrink: 0;
        font-size: 0.9em;
      }

      .thought-text {
        font-size: 0.8em;
        color: rgba(255, 255, 255, 0.8);
        font-style: italic;
        line-height: 1.4;
      }
    }
  }
}

// 记忆崩塌进度条区块（场景1-4专用）
.memory-collapse-section {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(#3498db, 0.12), rgba(#9b59b6, 0.08));
  border: 1px solid rgba(#3498db, 0.3);
  border-radius: 8px;

  .collapse-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;

    .collapse-icon {
      font-size: 1em;
    }

    .collapse-title {
      font-size: 0.8em;
      font-weight: bold;
      color: #3498db;
      font-family: $font-serif;
      letter-spacing: 1px;
      flex: 1;
    }

    .collapse-value {
      font-size: 0.9em;
      font-weight: bold;
      color: #3498db;

      &.danger {
        color: #e74c3c;
        animation: pulse-danger 1s ease-in-out infinite;
      }
    }
  }

  .collapse-bar-track {
    position: relative;
    height: 10px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    overflow: visible;

    .collapse-bar-fill {
      height: 100%;
      border-radius: 5px;
      background: linear-gradient(90deg, #3498db, #9b59b6);
      transition: width 0.4s ease;

      &.critical {
        background: linear-gradient(90deg, #e74c3c, #c0392b);
        animation: threat-pulse 0.5s ease-in-out infinite;
      }

      .collapse-bar-glow {
        position: absolute;
        top: -2px;
        right: 0;
        width: 12px;
        height: calc(100% + 4px);
        background: rgba(255, 255, 255, 0.5);
        border-radius: 50%;
        filter: blur(3px);
      }
    }

    .collapse-threshold {
      position: absolute;
      top: -4px;
      bottom: -4px;

      .threshold-line {
        width: 2px;
        height: 100%;
        background: rgba(#e74c3c, 0.5);
      }
    }
  }

  .collapse-hint {
    margin-top: 6px;
    font-size: 0.7em;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;

    .hint-time {
      color: rgba(#3498db, 0.9);
    }
  }
}

// 梦境目标区块
.dream-objective {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(#f1c40f, 0.1), rgba(#e67e22, 0.08));
  border: 1px solid rgba(#f1c40f, 0.25);
  border-radius: 8px;

  .objective-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .objective-icon {
      font-size: 1em;
    }

    .objective-title {
      font-size: 0.8em;
      font-weight: bold;
      color: #f1c40f;
      font-family: $font-serif;
      letter-spacing: 1px;
    }
  }

  .objective-content {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.4;
    padding-left: 22px;
  }
}

// 记忆背景故事区块
.memory-backstory {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba($c-purple, 0.15), rgba(#9b59b6, 0.1));
  border: 1px solid rgba($c-purple, 0.3);
  border-radius: 8px;
  border-left: 3px solid rgba($c-purple, 0.6);

  .backstory-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .backstory-icon {
      font-size: 1em;
    }

    .backstory-title {
      font-size: 0.8em;
      font-weight: bold;
      color: $c-purple;
      font-family: $font-serif;
      letter-spacing: 1px;
    }
  }

  .backstory-content {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    padding-left: 22px;
    font-style: italic;
  }
}

// 赵霞心理想法区块（记忆中她当时的想法）
section.dream-thought {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: linear-gradient(135deg, rgba(#e91e63, 0.1), rgba(#9c27b0, 0.08));
  border: 1px solid rgba(#e91e63, 0.25);
  border-radius: 8px;
  border-left: 3px solid rgba(#e91e63, 0.5);

  .thought-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .thought-icon {
      font-size: 1em;
    }

    .thought-title {
      font-size: 0.8em;
      font-weight: bold;
      color: #e91e63;
      font-family: $font-serif;
      letter-spacing: 1px;
    }
  }

  .thought-content {
    font-size: 0.8em;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
    padding-left: 22px;
    font-style: italic;
  }
}

// 核心数值区域
.dream-stats-section {
  margin-bottom: 12px;
}

// 境界显示（横向布局）
.realm-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: rgba($c-purple, 0.1);
  border-radius: 8px;

  .realm-ring-wrapper {
    position: relative;
    width: 50px;
    height: 50px;
    flex-shrink: 0;

    .realm-ring {
      width: 100%;
      height: 100%;

      .ring-bg {
        fill: none;
        stroke: rgba(255, 255, 255, 0.1);
        stroke-width: 4;
      }

      .ring-fill {
        fill: none;
        stroke: $c-purple;
        stroke-width: 4;
        stroke-linecap: round;
        transform: rotate(-90deg);
        transform-origin: 50% 50%;
        transition: stroke-dasharray 0.5s ease;
        filter: drop-shadow(0 0 3px rgba($c-purple, 0.6));
      }
    }

    .realm-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      .realm-level {
        font-size: 1.2em;
        font-weight: bold;
        color: #dda0dd;
        font-family: $font-serif;
      }
    }
  }

  .realm-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .realm-name {
      font-size: 1em;
      font-weight: bold;
      font-family: $font-serif;
      color: #dda0dd;
    }

    .realm-desc {
      font-size: 0.7em;
      color: $c-text-sub;
    }
  }
}

// 三个核心数值网格
.core-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.core-stat-item {
  .stat-label {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;

    .stat-icon {
      font-size: 0.9em;
    }

    .stat-name {
      font-size: 0.8em;
      color: $c-text-sub;
    }
  }

  .stat-bar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;

    .stat-bar-track {
      flex: 1;
      position: relative;
      height: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: visible;

      .stat-bar-fill {
        position: relative;
        height: 100%;
        border-radius: 4px;
        transition: width 0.4s ease;
        z-index: 2;

        .bar-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
          border-radius: 0 4px 4px 0;
        }

        &.affection {
          background: linear-gradient(90deg, #ff6b9d, #ff4757);
        }

        &.desire {
          background: linear-gradient(90deg, $c-purple, lighten($c-purple, 15%));
        }

        &.moral {
          background: linear-gradient(90deg, $c-green, lighten($c-green, 10%));
        }
      }

      // 缓冲条样式
      .stat-bar-buffer {
        position: absolute;
        top: 0;
        height: 100%;
        border-radius: 4px;
        opacity: 0.25;
        z-index: 1;

        &.affection {
          background: linear-gradient(90deg, #ff6b9d, #ff4757);
        }

        &.desire {
          background: linear-gradient(90deg, $c-purple, lighten($c-purple, 15%));
        }

        &.moral {
          background: linear-gradient(90deg, $c-green, lighten($c-green, 10%));
        }
      }
    }

    .stat-value {
      min-width: 28px;
      text-align: right;
      font-size: 0.85em;
      font-weight: bold;
      color: #fff;
    }
  }
}

// 认知开发区域（缓冲条样式）
.dream-body-section {
  margin-bottom: 12px;
  position: relative;
}

.body-progress-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;

  &.dimmed {
    opacity: 0.2;
    filter: blur(3px);
  }
}

.body-progress-item {
  padding: 8px 10px;
  background: rgba($c-purple, 0.08);
  border: 1px solid rgba($c-purple, 0.15);
  border-radius: 8px;

  .body-part-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .body-part-icon {
      font-size: 1em;
    }

    .body-part-name {
      flex: 1;
      font-size: 0.8em;
      color: #dda0dd;
      font-family: $font-serif;
    }

    .body-part-value {
      font-size: 0.75em;
      font-weight: bold;
      color: #fff;
    }
  }

  .body-bar-track {
    position: relative;
    height: 10px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    overflow: visible;

    .body-bar-fill {
      position: relative;
      height: 100%;
      background: linear-gradient(90deg, $c-purple, lighten($c-purple, 15%));
      border-radius: 5px;
      transition: width 0.4s ease;
      z-index: 2;

      .body-bar-glow {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 8px;
        height: calc(100% + 4px);
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        filter: blur(2px);
      }
    }

    // 缓冲条（当晚可增加进度）
    .body-bar-buffer {
      position: absolute;
      top: 0;
      height: 100%;
      background: repeating-linear-gradient(
        90deg,
        rgba($c-purple, 0.3),
        rgba($c-purple, 0.3) 3px,
        rgba($c-purple, 0.15) 3px,
        rgba($c-purple, 0.15) 6px
      );
      border-radius: 5px;
      z-index: 1;
      animation: buffer-pulse 2s ease-in-out infinite;
    }

    // 等级标记
    .level-markers {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;

      .marker {
        position: absolute;
        top: 0;
        width: 1px;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .body-part-level {
    margin-top: 4px;
    text-align: right;
    font-size: 0.65em;
    color: $c-text-sub;
  }
}

@keyframes buffer-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

// 部位选择遮罩层（新版）
.selection-overlay-new {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  .selection-card {
    width: 90%;
    max-width: 280px;
    padding: 16px;
    background: linear-gradient(135deg, rgba($c-purple-dim, 0.95), rgba(#1a1a2e, 0.98));
    border: 1px solid rgba($c-purple, 0.4);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba($c-purple, 0.3);
    backdrop-filter: blur(8px);

    .selection-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;

      .selection-icon {
        font-size: 1.2em;
      }

      .selection-title {
        font-size: 1em;
        font-weight: bold;
        font-family: $font-serif;
        color: #dda0dd;
        letter-spacing: 1px;
      }
    }

    .selection-hint {
      text-align: center;
      font-size: 0.75em;
      color: $c-text-sub;
      margin-bottom: 12px;
    }

    .selection-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;

      .selection-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba($c-purple, 0.2);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.25s ease;

        &:hover {
          background: rgba($c-purple, 0.2);
          border-color: rgba($c-purple, 0.4);
        }

        &.selected {
          background: rgba($c-purple, 0.35);
          border-color: rgba($c-purple, 0.6);

          .selection-checkbox {
            background: $c-purple;
            border-color: $c-purple;
          }
        }

        .selection-checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;

          .check-mark {
            color: #fff;
            font-size: 0.7em;
            font-weight: bold;
          }
        }

        .selection-part-icon {
          font-size: 1em;
        }

        .selection-part-name {
          font-size: 0.8em;
          color: #fff;
        }
      }
    }

    .confirm-button {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, $c-purple, $c-purple-dim);
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 0.9em;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.25s ease;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, lighten($c-purple, 10%), $c-purple);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($c-purple, 0.4);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}

// 威胁监控区域
.dream-threat-section {
  margin-bottom: 12px;
}

.threat-bar-item {
  padding: 10px 12px;
  background: rgba(#e74c3c, 0.08);
  border: 1px solid rgba(#e74c3c, 0.2);
  border-radius: 8px;

  .threat-bar-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .threat-icon {
      font-size: 1em;
    }

    .threat-name {
      flex: 1;
      font-size: 0.8em;
      color: $c-text-sub;
    }

    .threat-value {
      font-size: 0.85em;
      font-weight: bold;
      color: #fff;

      &.danger {
        color: #ff4757;
        animation: pulse-danger 1s ease-in-out infinite;
      }
    }
  }

  .threat-bar-track {
    position: relative;
    height: 8px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    overflow: visible;

    .threat-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;

      &.chaos {
        background: linear-gradient(90deg, #9b59b6, #e74c3c);
      }

      &.critical {
        animation: threat-pulse 0.5s ease-in-out infinite;
      }

      .threat-bar-glow {
        position: absolute;
        top: -2px;
        right: 0;
        width: 12px;
        height: calc(100% + 4px);
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        filter: blur(2px);
      }
    }

    .danger-threshold {
      position: absolute;
      top: -8px;
      bottom: -8px;
      display: flex;
      flex-direction: column;
      align-items: center;

      .threshold-line {
        width: 2px;
        height: 100%;
        background: rgba(#ff4757, 0.6);
      }

      .threshold-label {
        position: absolute;
        top: -14px;
        font-size: 0.55em;
        color: #ff4757;
        white-space: nowrap;
      }
    }
  }

  .threat-hint {
    margin-top: 6px;
    font-size: 0.7em;
    color: #ff4757;
    text-align: center;
  }
}

@keyframes threat-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

// ========== 响应式适配（手机端） ==========
@media (max-width: 480px) {
  // 主面板减少内边距
  .main-panel {
    padding: 10px 12px;
  }

  // 头部紧凑化
  .header {
    margin-bottom: 8px;
    padding-bottom: 8px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .world-info {
    gap: 6px;
  }

  .info-item {
    font-size: 0.8em;
  }

  .mode-badge {
    padding: 3px 8px;
    font-size: 0.7em;
  }

  // 角色区块紧凑化
  .character-section {
    margin-bottom: 8px;
    padding: 8px 10px;
  }

  .location-row {
    font-size: 0.85em;
    margin-bottom: 6px;
  }

  .thought-bubble {
    padding: 6px 8px;
    font-size: 0.8em;
  }

  // 服装网格改为2列
  .outfit-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 4px;
  }

  .outfit-item {
    padding: 4px 6px;

    .outfit-label {
      font-size: 0.65em;
    }

    .outfit-value {
      font-size: 0.7em;
    }
  }

  // 关系状态网格改为单列
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stats-column {
    gap: 6px;
  }

  .relationship-card,
  .realm-card {
    padding: 8px;

    .relation-header,
    .realm-header {
      margin-bottom: 4px;
    }

    .relation-value,
    .realm-value {
      font-size: 0.85em;
    }
  }

  // 区块标题紧凑化
  .section-title {
    margin-bottom: 8px;

    &.compact {
      margin-bottom: 6px;
    }

    .title-text {
      font-size: 0.75em;
      letter-spacing: 1px;
    }
  }

  // 部位进度网格保持3列但更紧凑
  .body-grid {
    gap: 4px;
  }

  .body-item {
    padding: 4px 3px;
  }

  .part-name {
    font-size: 0.6em;
  }

  .part-value {
    font-size: 0.65em;
  }

  // 选择遮罩层适配
  .selection-overlay {
    padding: 8px;
    gap: 6px;
  }

  .selection-title {
    font-size: 0.8em;
  }

  .selection-hint {
    font-size: 0.65em;
  }

  .selection-grid {
    gap: 4px;
  }

  .selection-item {
    padding: 6px 8px;
    gap: 5px;
  }

  .selection-checkbox {
    width: 14px;
    height: 14px;
  }

  .selection-part-name {
    font-size: 0.75em;
  }

  // 丈夫状态行紧凑化
  .husband-row {
    padding: 6px 10px;
    gap: 6px;

    .husband-text {
      font-size: 0.8em;
    }
  }

  // 统计项紧凑化
  .stat-item {
    margin-bottom: 4px;
  }

  .stat-header {
    margin-bottom: 3px;

    .stat-label {
      font-size: 0.7em;
    }

    .stat-value {
      font-size: 0.75em;
    }
  }

  .progress-track {
    height: 5px;
  }

  // 梦境场景信息紧凑化
  .dream-scene-info {
    padding: 10px;
    margin-bottom: 8px;

    .scene-header {
      margin-bottom: 8px;

      .scene-icon {
        font-size: 1.1em;
      }

      .scene-title {
        font-size: 0.85em;
      }
    }
  }

  .scene-progress-dots {
    gap: 6px;
    margin-bottom: 8px;
  }

  .scene-dot {
    width: 28px;
    height: 28px;
    font-size: 0.7em;
  }

  // 场景5进度紧凑化
  .scene5-progress {
    margin-top: 8px;
    padding-top: 8px;

    .progress-header {
      margin-bottom: 4px;

      .progress-label {
        font-size: 0.75em;
      }

      .progress-value {
        font-size: 0.8em;
      }
    }

    .completion-info {
      font-size: 0.75em;
      gap: 6px;
    }
  }

  // 环形进度适配
  .stage-ring-container {
    width: 70px;
    height: 70px;
    margin: 6px auto;
  }

  .stage-text {
    .label {
      font-size: 0.6em;
    }

    .value {
      font-size: 0.75em;
    }
  }

  // ========== 梦境模式新UI响应式 ==========

  // 角色卡片紧凑化
  .dream-character-card {
    padding: 10px;
    gap: 10px;

    .character-avatar {
      .avatar-icon {
        width: 40px;
        height: 40px;
        font-size: 1.4em;
      }

      .age-badge {
        padding: 1px 4px;
        font-size: 0.6em;
      }
    }

    .character-info {
      .character-name {
        margin-bottom: 4px;

        .name-text {
          font-size: 0.95em;
        }

        .memory-tag {
          font-size: 0.55em;
          padding: 1px 4px;
        }
      }

      .dream-thought {
        padding: 6px 8px;

        .thought-text {
          font-size: 0.75em;
        }
      }
    }
  }

  // 梦境目标紧凑化
  .dream-objective {
    padding: 8px 10px;
    margin-bottom: 10px;

    .objective-header {
      margin-bottom: 4px;

      .objective-title {
        font-size: 0.75em;
      }
    }

    .objective-content {
      font-size: 0.8em;
      padding-left: 18px;
    }
  }

  // 记忆背景故事紧凑化
  .memory-backstory {
    padding: 8px 10px;
    margin-bottom: 10px;

    .backstory-header {
      margin-bottom: 4px;

      .backstory-title {
        font-size: 0.75em;
      }
    }

    .backstory-content {
      font-size: 0.75em;
      padding-left: 18px;
    }
  }

  // 境界显示紧凑化
  .realm-display {
    padding: 8px 10px;
    gap: 10px;
    margin-bottom: 10px;

    .realm-ring-wrapper {
      width: 40px;
      height: 40px;

      .realm-center .realm-level {
        font-size: 1em;
      }
    }

    .realm-info {
      .realm-name {
        font-size: 0.9em;
      }

      .realm-desc {
        font-size: 0.65em;
      }
    }
  }

  // 核心数值紧凑化
  .core-stats-grid {
    gap: 8px;
  }

  .core-stat-item {
    .stat-label {
      margin-bottom: 3px;

      .stat-icon {
        font-size: 0.8em;
      }

      .stat-name {
        font-size: 0.75em;
      }
    }

    .stat-bar-wrapper {
      gap: 6px;

      .stat-bar-track {
        height: 6px;
      }

      .stat-value {
        font-size: 0.8em;
        min-width: 24px;
      }
    }
  }

  // 认知开发区域紧凑化
  .dream-body-section {
    margin-bottom: 10px;
  }

  .body-progress-container {
    gap: 8px;
  }

  .body-progress-item {
    padding: 6px 8px;

    .body-part-header {
      margin-bottom: 4px;

      .body-part-icon {
        font-size: 0.9em;
      }

      .body-part-name {
        font-size: 0.75em;
      }

      .body-part-value {
        font-size: 0.7em;
      }
    }

    .body-bar-track {
      height: 8px;
    }

    .body-part-level {
      font-size: 0.6em;
      margin-top: 3px;
    }
  }

  // 选择遮罩层紧凑化
  .selection-overlay-new {
    .selection-card {
      padding: 12px;
      max-width: 260px;

      .selection-header {
        margin-bottom: 6px;

        .selection-icon {
          font-size: 1em;
        }

        .selection-title {
          font-size: 0.9em;
        }
      }

      .selection-hint {
        font-size: 0.7em;
        margin-bottom: 10px;
      }

      .selection-grid {
        gap: 6px;
        margin-bottom: 10px;

        .selection-item {
          padding: 8px;
          gap: 6px;

          .selection-checkbox {
            width: 16px;
            height: 16px;
          }

          .selection-part-icon {
            font-size: 0.9em;
          }

          .selection-part-name {
            font-size: 0.75em;
          }
        }
      }

      .confirm-button {
        padding: 8px;
        font-size: 0.85em;
      }
    }
  }

  // 威胁监控紧凑化
  .dream-threat-section {
    margin-bottom: 10px;
  }

  .threat-bar-item {
    padding: 8px 10px;

    .threat-bar-header {
      margin-bottom: 5px;

      .threat-icon {
        font-size: 0.9em;
      }

      .threat-name {
        font-size: 0.75em;
      }

      .threat-value {
        font-size: 0.8em;
      }
    }

    .threat-bar-track {
      height: 6px;

      .danger-threshold {
        .threshold-label {
          font-size: 0.5em;
          top: -12px;
        }
      }
    }

    .threat-hint {
      font-size: 0.65em;
      margin-top: 5px;
    }
  }
}

// 中等屏幕（平板竖屏）
@media (min-width: 481px) and (max-width: 768px) {
  .main-panel {
    padding: 12px 14px;
  }

  .header {
    margin-bottom: 10px;
  }

  .character-section {
    margin-bottom: 10px;
    padding: 9px 11px;
  }

  .stats-grid {
    gap: 10px;
  }

  .body-grid {
    gap: 5px;
  }

  .body-item {
    padding: 5px 4px;
  }
}

// ========== 真相模式新增样式 ==========

// 真相模式阶段标签
.phase-tag.phase-truth {
  background: linear-gradient(135deg, rgba($c-red, 0.3), rgba($c-pink, 0.2));
  border: 1px solid rgba($c-pink, 0.4);
  color: $c-pink;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: bold;
  letter-spacing: 1px;
}

// 真相模式境界卡片
.truth-mode .realm-card.truth-realm {
  background: linear-gradient(135deg, rgba($c-pink, 0.15), rgba($c-red, 0.1));
  border: 1px solid rgba($c-pink, 0.3);
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 10px;

  .realm-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;

    .realm-icon {
      font-size: 1em;
    }

    .realm-title {
      font-size: 0.8em;
      font-family: $font-serif;
      color: $c-pink;
      letter-spacing: 1px;
    }
  }

  .realm-value {
    font-size: 1.1em;
    font-weight: bold;
    font-family: $font-serif;
    color: #fff;
    margin-bottom: 6px;
    text-shadow: 0 0 8px rgba($c-pink, 0.4);
  }

  .realm-progress {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 6px;

    .realm-bar {
      height: 100%;
      background: linear-gradient(90deg, $c-pink, lighten($c-pink, 15%));
      border-radius: 2px;
      transition: width 0.4s ease;
    }
  }

  .realm-hint {
    font-size: 0.7em;
    color: $c-text-sub;
    font-style: italic;
  }
}

// 真相模式威胁数值紧凑区域
.truth-mode .threat-compact {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba($c-pink, 0.2);

  .stat-item.threat {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .stat-header .name {
      color: $c-text-sub;
    }
  }
}

// 真相模式底部区域
.truth-mode .truth-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba($c-pink, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// 苦主视角展示区
.husband-perspective {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba($c-pink, 0.2);
  border-radius: 8px;
  padding: 10px 12px;

  .perspective-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed rgba($c-pink, 0.15);

    .perspective-icon {
      font-size: 0.9em;
      opacity: 0.8;
    }

    .perspective-title {
      font-size: 0.8em;
      font-family: $font-serif;
      color: $c-text-sub;
      letter-spacing: 1px;
    }

    .perspective-suspicion {
      margin-left: auto;
      font-size: 0.7em;
      color: $c-text-sub;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;

      &.danger {
        color: $c-danger;
        background: rgba($c-danger, 0.1);
      }
    }
  }

  .perspective-content {
    .perspective-thought {
      font-size: 0.75em;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
      font-style: italic;
      margin: 0;
    }
  }
}

// 结局结算区域（Day 5, 10:00+）
.ending-settlement {
  margin-top: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba($c-pink, 0.25);
  border-radius: 8px;

  .settlement-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px dashed rgba($c-pink, 0.2);

    .header-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .settlement-icon {
        font-size: 0.9em;
      }

      .settlement-title {
        font-size: 0.8em;
        font-family: $font-serif;
        color: $c-text-sub;
        letter-spacing: 1px;
      }
    }

    .header-right {
      .ending-prediction {
        font-size: 0.75em;
        font-weight: bold;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);

        &.perfect-ending {
          color: #ffd700;
          background: rgba(#ffd700, 0.2);
          border: 1px solid rgba(#ffd700, 0.4);
        }

        &.true-ending {
          color: #ff69b4;
          background: rgba(#ff69b4, 0.15);
          border: 1px solid rgba(#ff69b4, 0.3);
        }

        &.false-ending {
          color: #9370db;
          background: rgba(#9370db, 0.15);
          border: 1px solid rgba(#9370db, 0.3);
        }

        &.bad-ending {
          color: $c-danger;
          background: rgba($c-danger, 0.15);
          border: 1px solid rgba($c-danger, 0.3);
        }

        &.normal-ending {
          color: #a0a0a0;
          background: rgba(#a0a0a0, 0.15);
          border: 1px solid rgba(#a0a0a0, 0.3);
        }

        &.pending {
          color: $c-text-sub;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      }
    }
  }

  .scene-checklist {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .scene-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75em;
      background: rgba(255, 255, 255, 0.03);
      transition: all 0.2s ease;

      .scene-checkbox {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        font-size: 0.9em;
        font-weight: bold;
      }

      .scene-number {
        width: 14px;
        text-align: center;
        color: $c-text-sub;
      }

      .scene-name {
        flex: 1;
        color: rgba(255, 255, 255, 0.7);
      }

      // 正确重构（绿色打勾）
      &.correct {
        background: rgba(#4caf50, 0.1);
        border-left: 2px solid #4caf50;

        .scene-checkbox {
          color: #4caf50;
          background: rgba(#4caf50, 0.15);
        }

        .scene-name {
          color: #4caf50;
        }
      }

      // 已完成但错误（红色叉）
      &.completed:not(.correct) {
        background: rgba($c-danger, 0.1);
        border-left: 2px solid $c-danger;

        .scene-checkbox {
          color: $c-danger;
          background: rgba($c-danger, 0.15);
        }

        .scene-name {
          color: rgba($c-danger, 0.8);
        }
      }

      // 未触发（灰色圆圈）
      &.missed {
        opacity: 0.6;
        border-left: 2px solid transparent;

        .scene-checkbox {
          color: $c-text-sub;
          background: rgba(255, 255, 255, 0.05);
        }

        .scene-name {
          color: $c-text-sub;
        }
      }
    }
  }

  .ending-countdown {
    margin-top: 10px;
    padding: 8px 10px;
    background: linear-gradient(135deg, rgba($c-pink, 0.1) 0%, rgba($c-purple, 0.1) 100%);
    border: 1px solid rgba($c-pink, 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;

    .countdown-icon {
      font-size: 1em;
    }

    .countdown-text {
      font-size: 0.75em;
      color: rgba(255, 255, 255, 0.8);

      strong {
        color: $c-pink;
        font-weight: bold;
        font-size: 1.1em;
      }
    }
  }
}

// 梦境入口倒计时格子
.dream-countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba($c-purple, 0.1);
  border: 1px solid rgba($c-purple, 0.2);
  border-radius: 6px;
  padding: 4px;
  transition: all 0.3s ease;

  &.dream-open {
    background: rgba($c-purple, 0.25);
    border-color: rgba($c-purple, 0.5);
    box-shadow: 0 0 10px rgba($c-purple, 0.3);
    animation: glow-hint 2s ease-in-out infinite;
  }

  // Bug #17 修复：梦境入口被禁止时的样式
  &.dream-blocked {
    background: rgba(100, 100, 100, 0.15);
    border-color: rgba(100, 100, 100, 0.3);
    opacity: 0.7;

    .part-name {
      color: #999;
    }
  }

  .part-name {
    font-size: 0.65em;
    color: #dda0dd;
    margin-bottom: 2px;
  }

  .countdown-display {
    display: flex;
    align-items: baseline;
    gap: 2px;

    .countdown-time {
      font-size: 1em;
      font-weight: bold;
      color: #dda0dd;
    }

    .countdown-label {
      font-size: 0.6em;
      color: $c-text-sub;
    }

    .countdown-status {
      font-size: 0.7em;
      font-weight: bold;

      &.open {
        color: $c-green;
        text-shadow: 0 0 4px rgba($c-green, 0.5);
      }

      // Bug #17 修复：已关闭状态的样式
      &.blocked {
        color: #999;
      }
    }
  }
}

// Bug #21 修复：自由模式结局信息格子
.ending-info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba($c-gold, 0.2), rgba($c-pink, 0.15));
  border: 1px solid rgba($c-gold, 0.4);
  border-radius: 6px;
  padding: 4px;
  animation: gentle-glow 3s ease-in-out infinite;

  .part-name {
    font-size: 0.6em;
    color: $c-gold;
    margin-bottom: 2px;
  }

  .ending-badge {
    .ending-status {
      font-size: 0.65em;
      font-weight: bold;
      color: $c-gold;
      text-shadow: 0 0 4px rgba($c-gold, 0.5);
    }
  }
}

// Bug #21 修复：自由模式提示区
.free-mode-info {
  background: linear-gradient(135deg, rgba($c-gold, 0.15), rgba($c-pink, 0.1));
  border: 1px solid rgba($c-gold, 0.3);
  border-radius: 8px;
  padding: 12px;

  .free-mode-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .free-mode-icon {
      font-size: 1.1em;
    }

    .free-mode-title {
      font-size: 0.85em;
      font-family: $font-serif;
      color: $c-gold;
      letter-spacing: 1px;
    }
  }

  .free-mode-content {
    .free-mode-text {
      font-size: 0.75em;
      color: $c-text;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .free-mode-hint {
      font-size: 0.7em;
      color: $c-text-sub;
      font-style: italic;
    }
  }
}

@keyframes gentle-glow {
  0%,
  100% {
    box-shadow: 0 0 6px rgba($c-gold, 0.2);
  }
  50% {
    box-shadow: 0 0 12px rgba($c-gold, 0.4);
  }
}

// 紧凑版场景进度
.scene-progress-compact {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba($c-purple, 0.2);
  border-radius: 8px;
  padding: 10px 12px;

  .scene-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;

    .scene-icon {
      font-size: 0.9em;
    }

    .scene-title {
      font-size: 0.8em;
      font-family: $font-serif;
      color: #dda0dd;
      letter-spacing: 1px;
    }

    .scene-stats {
      margin-left: auto;
      font-size: 0.7em;
      color: $c-text-sub;
    }
  }

  .scene-dots {
    display: flex;
    justify-content: center;
    gap: 8px;

    .scene-dot {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.7em;
      color: #555;
      transition: all 0.3s;

      &.completed {
        background: rgba($c-purple, 0.3);
        border-color: rgba($c-purple, 0.5);
        color: #dda0dd;
      }

      &.correct {
        background: rgba($c-green, 0.25);
        border: 2px solid $c-green;
        box-shadow: 0 0 6px rgba($c-green, 0.3);
        color: $c-green;
        font-weight: bold;
      }
    }
  }
}

// 真相模式梦境入口提示（行内版）
.dream-hint-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba($c-purple, 0.15), rgba($c-purple-dim, 0.1));
  border: 1px solid rgba($c-purple, 0.3);
  border-radius: 8px;
  animation: glow-hint 2s ease-in-out infinite;

  .hint-icon {
    font-size: 0.9em;
  }

  .hint-text {
    font-size: 0.8em;
    font-family: $font-serif;
    color: #dda0dd;
    letter-spacing: 1px;
  }
}

// 真相模式响应式适配
@media (max-width: 480px) {
  .truth-mode .truth-footer {
    gap: 8px;
    margin-top: 10px;
    padding-top: 10px;
  }

  .scene-progress-compact {
    padding: 8px 10px;

    .scene-header {
      margin-bottom: 6px;
      flex-wrap: wrap;

      .scene-stats {
        width: 100%;
        margin-left: 0;
        margin-top: 4px;
        text-align: center;
      }
    }

    .scene-dots {
      gap: 6px;

      .scene-dot {
        width: 22px;
        height: 22px;
        font-size: 0.65em;
      }
    }
  }

  .dream-hint-inline {
    padding: 6px 10px;

    .hint-icon {
      font-size: 0.85em;
    }

    .hint-text {
      font-size: 0.75em;
    }
  }

  .truth-mode .realm-card.truth-realm {
    padding: 8px 10px;

    .realm-value {
      font-size: 1em;
    }

    .realm-hint {
      font-size: 0.65em;
    }
  }

  .truth-mode .threat-compact {
    margin-top: 8px;
    padding-top: 8px;

    .stat-item.threat {
      margin-bottom: 6px;
    }
  }
}
</style>
