#!/usr/bin/env node

/**
 * Test script to verify sync functionality
 * Run this in the browser console or as a Node.js script
 */

console.log('🧪 Testing Battery Technologies Sync Functionality...')

// Test 1: Check if sync manager is available
function testSyncManagerAvailability() {
  console.log('\n1. Testing Sync Manager Availability...')
  
  if (typeof window !== 'undefined') {
    if (window.syncManager) {
      console.log('✅ Sync Manager is available globally')
      return true
    } else {
      console.log('❌ Sync Manager is not available globally')
      return false
    }
  } else {
    console.log('⚠️ Running in Node.js environment - sync manager not available')
    return false
  }
}

// Test 2: Check sync status
async function testSyncStatus() {
  console.log('\n2. Testing Sync Status...')
  
  if (typeof window !== 'undefined' && window.getSyncStatus) {
    try {
      const status = await window.getSyncStatus()
      console.log('📊 Current sync status:', status)
      return true
    } catch (error) {
      console.log('❌ Error getting sync status:', error)
      return false
    }
  } else {
    console.log('⚠️ getSyncStatus function not available')
    return false
  }
}

// Test 3: Test manual sync trigger
async function testManualSync() {
  console.log('\n3. Testing Manual Sync Trigger...')
  
  if (typeof window !== 'undefined' && window.triggerSync) {
    try {
      console.log('🔄 Triggering manual sync...')
      window.triggerSync()
      console.log('✅ Manual sync triggered successfully')
      return true
    } catch (error) {
      console.log('❌ Error triggering manual sync:', error)
      return false
    }
  } else {
    console.log('⚠️ triggerSync function not available')
    return false
  }
}

// Test 4: Test offline storage
async function testOfflineStorage() {
  console.log('\n4. Testing Offline Storage...')
  
  if (typeof window !== 'undefined' && window.debugOfflineStorage) {
    try {
      console.log('🔍 Checking offline storage contents...')
      await window.debugOfflineStorage()
      console.log('✅ Offline storage check completed')
      return true
    } catch (error) {
      console.log('❌ Error checking offline storage:', error)
      return false
    }
  } else {
    console.log('⚠️ debugOfflineStorage function not available')
    return false
  }
}

// Test 5: Test asset caching
async function testAssetCaching() {
  console.log('\n5. Testing Asset Caching...')
  
  if (typeof window !== 'undefined' && window.forceCacheAssets) {
    try {
      console.log('🔄 Testing asset caching...')
      window.forceCacheAssets()
      console.log('✅ Asset caching triggered')
      return true
    } catch (error) {
      console.log('❌ Error testing asset caching:', error)
      return false
    }
  } else {
    console.log('⚠️ forceCacheAssets function not available')
    return false
  }
}

// Test 6: Test cache contents
async function testCacheContents() {
  console.log('\n6. Testing Cache Contents...')
  
  if (typeof window !== 'undefined' && window.checkCacheContents) {
    try {
      console.log('🔍 Checking cache contents...')
      await window.checkCacheContents()
      console.log('✅ Cache contents check completed')
      return true
    } catch (error) {
      console.log('❌ Error checking cache contents:', error)
      return false
    }
  } else {
    console.log('⚠️ checkCacheContents function not available')
    return false
  }
}

// Test 7: Test job pre-caching
async function testJobPrecaching() {
  console.log('\n7. Testing Job Pre-caching...')
  
  if (typeof window !== 'undefined' && window.precacheJobDetails) {
    try {
      console.log('🔧 Testing job pre-caching with sample job IDs...')
      // Use some sample job IDs for testing
      const sampleJobIds = ['test-job-1', 'test-job-2']
      const result = await window.precacheJobDetails(sampleJobIds)
      console.log('✅ Job pre-caching test completed:', result)
      return true
    } catch (error) {
      console.log('❌ Error testing job pre-caching:', error)
      return false
    }
  } else {
    console.log('⚠️ precacheJobDetails function not available')
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting sync functionality tests...\n')
  
  const results = {
    syncManagerAvailable: testSyncManagerAvailability(),
    syncStatus: await testSyncStatus(),
    manualSync: await testManualSync(),
    offlineStorage: await testOfflineStorage(),
    assetCaching: await testAssetCaching(),
    cacheContents: await testCacheContents(),
    jobPrecaching: await testJobPrecaching()
  }
  
  console.log('\n📋 Test Results Summary:')
  console.log('========================')
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`)
  })
  
  const allPassed = Object.values(results).every(result => result === true)
  console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed. Check the logs above.'}`)
  
  return results
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.testSync = runAllTests
  console.log('💡 Run testSync() in the browser console to test sync functionality')
}

// Run tests if this is executed directly
if (typeof window === 'undefined') {
  runAllTests().catch(console.error)
}

module.exports = { runAllTests, testSyncManagerAvailability, testSyncStatus, testManualSync, testOfflineStorage, testAssetCaching, testCacheContents, testJobPrecaching }
