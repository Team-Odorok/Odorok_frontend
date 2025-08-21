<template>
    <button @click="handelLike">
        좋아요 {{ likeCount }}
    </button>
</template>

<script>
export default {
    name: "LikeButoon",
    props: {
        likeCount: {
            type: Number,
            default: 0
        }
    },
    methods: {
        handelLike() {
            this.$emit("like-clicked");
        }
    }
    

};
</script>

<style>
</style>