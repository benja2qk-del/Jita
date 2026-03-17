const CampaignSystem = {
    initCampaign() {
        const districtKeys = Districts.region.districts;
        const campaignData = {
            regionName: Districts.region.name,
            currentDistrict: districtKeys[0],
            districts: {},
            completedDistricts: [],
            currentNodeId: null,
            bossDefeated: false
        };

        districtKeys.forEach(key => {
            const dist = Districts.data[key];
            const nodeStates = {};
            dist.nodes.forEach((node, i) => {
                nodeStates[node.id] = {
                    unlocked: i === 0,
                    completed: false,
                    visited: false
                };
            });
            campaignData.districts[key] = {
                name: dist.name,
                nodeStates,
                completed: false
            };
        });

        GameState.campaign = campaignData;
    },

    getCurrentDistrictData() {
        const key = GameState.campaign.currentDistrict;
        return Districts.data[key];
    },

    getCurrentDistrictState() {
        const key = GameState.campaign.currentDistrict;
        return GameState.campaign.districts[key];
    },

    isNodeAccessible(nodeId) {
        const state = this.getCurrentDistrictState();
        const ns = state.nodeStates[nodeId];
        return ns && ns.unlocked && !ns.completed;
    },

    visitNode(nodeId) {
        // Find which district contains this node
        const districtKeys = Districts.region.districts;
        let distData = null, distState = null;
        for (const key of districtKeys) {
            const dd = Districts.data[key];
            const ds = GameState.campaign.districts[key];
            if (dd.nodes.find(n => n.id === nodeId)) {
                distData = dd;
                distState = ds;
                break;
            }
        }
        if (!distData || !distState) return;
        const ns = distState.nodeStates[nodeId];
        if (!ns) return;
        ns.visited = true;
        const node = distData.nodes.find(n => n.id === nodeId);
        if (node && node.next) {
            node.next.forEach(nextId => {
                if (distState.nodeStates[nextId]) {
                    distState.nodeStates[nextId].unlocked = true;
                }
            });
        }
    },

    completeNode(nodeId) {
        const distData = this.getCurrentDistrictData();
        const distState = this.getCurrentDistrictState();
        const ns = distState.nodeStates[nodeId];
        if (!ns) return;

        ns.completed = true;
        ns.visited = true;

        const node = distData.nodes.find(n => n.id === nodeId);
        if (node && node.next) {
            node.next.forEach(nextId => {
                if (distState.nodeStates[nextId]) {
                    distState.nodeStates[nextId].unlocked = true;
                }
            });
        }

        if (node.type === 'capital' || node.type === 'boss') {
            this.completeDistrict();
        }

        // Apply district bonuses from completed districts
        this.applyDistrictBonuses();
    },

    completeDistrict() {
        const key = GameState.campaign.currentDistrict;
        const distState = this.getCurrentDistrictState();
        distState.completed = true;

        if (!GameState.campaign.completedDistricts.includes(key)) {
            GameState.campaign.completedDistricts.push(key);
            const distData = Districts.data[key];
            if (distData.bonus) {
                GameState.player.districtBonuses.push(distData.bonus);
            }
        }

        const districtKeys = Districts.region.districts;
        const nextIndex = districtKeys.indexOf(key) + 1;
        if (nextIndex < districtKeys.length) {
            GameState.campaign.currentDistrict = districtKeys[nextIndex];
        }
    },

    applyDistrictBonuses() {
        // Applied during loot/reward calculation
    },

    getDistrictBonusValue(type) {
        const bonuses = GameState.player.districtBonuses || [];
        let total = 0;
        bonuses.forEach(b => {
            if (b.type === type) total += b.value;
        });
        return total;
    },

    isRegionComplete() {
        const districtKeys = Districts.region.districts;
        return districtKeys.every(k => GameState.campaign.districts[k].completed);
    },

    getAvailableNodes() {
        const distData = this.getCurrentDistrictData();
        const distState = this.getCurrentDistrictState();
        return distData.nodes.filter(n => {
            const ns = distState.nodeStates[n.id];
            return ns && ns.unlocked && !ns.completed;
        });
    }
};
