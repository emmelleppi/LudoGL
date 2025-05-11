import sharedProps from '@/sharedProps';

export const BLEND_FACTORS = {
	ZERO: sharedProps.gl.ZERO,
	ONE: sharedProps.gl.ONE,
	SRC_COLOR: sharedProps.gl.SRC_COLOR,
	DST_COLOR: sharedProps.gl.DST_COLOR,
	SRC_ALPHA: sharedProps.gl.SRC_ALPHA,
	DST_ALPHA: sharedProps.gl.DST_ALPHA,
	ONE_MINUS_SRC_COLOR: sharedProps.gl.ONE_MINUS_SRC_COLOR,
	ONE_MINUS_DST_COLOR: sharedProps.gl.ONE_MINUS_DST_COLOR,
	ONE_MINUS_SRC_ALPHA: sharedProps.gl.ONE_MINUS_SRC_ALPHA,
	ONE_MINUS_DST_ALPHA: sharedProps.gl.ONE_MINUS_DST_ALPHA,
};

export const BLEND_EQUATIONS = {
	ADD: sharedProps.gl.FUNC_ADD,
	SUBTRACT: sharedProps.gl.FUNC_SUBTRACT,
	REVERSE_SUBTRACT: sharedProps.gl.FUNC_REVERSE_SUBTRACT,
	MIN: sharedProps.gl.MIN,
	MAX: sharedProps.gl.MAX,
};

export const BLEND = {
	NONE: {
		blendEnabled: false,
	},
	NORMAL: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.SRC_ALPHA,
			dst: BLEND_FACTORS.ONE_MINUS_SRC_ALPHA,
			srcAlpha: BLEND_FACTORS.ONE,
			dstAlpha: BLEND_FACTORS.ONE_MINUS_SRC_ALPHA,
			equation: BLEND_EQUATIONS.ADD,
			equationAlpha: BLEND_EQUATIONS.ADD,
		},
	},
	ADDITIVE: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.SRC_ALPHA,
			dst: BLEND_FACTORS.ONE,
			equation: BLEND_EQUATIONS.ADD,
		},
	},
	MULTIPLY: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.DST_COLOR,
			dst: BLEND_FACTORS.ZERO,
		},
	},
	SUBTRACT: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.ONE,
			dst: BLEND_FACTORS.ONE_MINUS_SRC_ALPHA,
		},
	},
	SCREEN: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.ONE,
			dst: BLEND_FACTORS.ONE_MINUS_SRC_COLOR,
			equation: BLEND_EQUATIONS.ADD,
		},
	},
	OVERLAY: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.DST_COLOR,
			dst: BLEND_FACTORS.SRC_COLOR,
		},
	},
	DARKEN: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.ONE,
			dst: BLEND_FACTORS.ONE,
			equation: BLEND_EQUATIONS.MIN,
		},
	},
	LIGHTEN: {
		blendEnabled: true,
		blendFunc: {
			src: BLEND_FACTORS.ONE,
			dst: BLEND_FACTORS.ONE,
			equation: BLEND_EQUATIONS.MAX,
		},
	},
};

export const FILTER = {
	NEAREST: {
		minFilter: sharedProps.gl.NEAREST,
		magFilter: sharedProps.gl.NEAREST,
	},
	LINEAR: {
		minFilter: sharedProps.gl.LINEAR,
		magFilter: sharedProps.gl.LINEAR,
	},
	NEAREST_MIPMAP_NEAREST: {
		minFilter: sharedProps.gl.NEAREST_MIPMAP_NEAREST,
		magFilter: sharedProps.gl.NEAREST,
	},
	LINEAR_MIPMAP_NEAREST: {
		minFilter: sharedProps.gl.LINEAR_MIPMAP_NEAREST,
		magFilter: sharedProps.gl.LINEAR,
	},
	NEAREST_MIPMAP_LINEAR: {
		minFilter: sharedProps.gl.NEAREST_MIPMAP_LINEAR,
		magFilter: sharedProps.gl.NEAREST,
	},
	LINEAR_MIPMAP_LINEAR: {
		minFilter: sharedProps.gl.LINEAR_MIPMAP_LINEAR,
		magFilter: sharedProps.gl.LINEAR,
	},
};

export const WRAP = {
	CLAMP_TO_EDGE: {
		wrapS: sharedProps.gl.CLAMP_TO_EDGE,
		wrapT: sharedProps.gl.CLAMP_TO_EDGE,
	},
	REPEAT: {
		wrapS: sharedProps.gl.REPEAT,
		wrapT: sharedProps.gl.REPEAT,
	},
	MIRRORED_REPEAT: {
		wrapS: sharedProps.gl.MIRRORED_REPEAT,
		wrapT: sharedProps.gl.MIRRORED_REPEAT,
	},
};

export const TYPE = {
	UNSIGNED_BYTE: {
		type: sharedProps.gl.UNSIGNED_BYTE,
		internalFormat: sharedProps.gl.RGBA8,
		channels: sharedProps.gl.RGBA,
	},
	RGB8: {
		type: sharedProps.gl.UNSIGNED_BYTE,
		internalFormat: sharedProps.gl.RGB8,
		channels: sharedProps.gl.RGB,
	},
	FLOAT: {
		type: sharedProps.gl.FLOAT,
		internalFormat: sharedProps.gl.RGBA32F,
		channels: sharedProps.gl.RGBA,
	},
	HALF_FLOAT: {
		type: sharedProps.gl.HALF_FLOAT,
		internalFormat: sharedProps.gl.RGBA16F,
		channels: sharedProps.gl.RGBA,
	},
	R11F_G11F_B10F: {
		type: sharedProps.gl.FLOAT,
		internalFormat: sharedProps.gl.R11F_G11F_B10F,
		channels: sharedProps.gl.RGB,
	},
	R16F: {
		type: sharedProps.gl.HALF_FLOAT,
		internalFormat: sharedProps.gl.R16F,
		channels: sharedProps.gl.RED,
	},
	R32F: {
		type: sharedProps.gl.FLOAT,
		internalFormat: sharedProps.gl.R32F,
		channels: sharedProps.gl.RED,
	},
	R8: {
		type: sharedProps.gl.UNSIGNED_BYTE,
		internalFormat: sharedProps.gl.R8,
		channels: sharedProps.gl.RED,
	},
	RG16F: {
		type: sharedProps.gl.HALF_FLOAT,
		internalFormat: sharedProps.gl.RG16F,
		channels: sharedProps.gl.RG,
	},
	RG32F: {
		type: sharedProps.gl.FLOAT,
		internalFormat: sharedProps.gl.RG32F,
		channels: sharedProps.gl.RG,
	},
};

export const DEPTH_TYPE = {
	DEPTH_COMPONENT32F: {
		type: sharedProps.gl.FLOAT,
		internalFormat: sharedProps.gl.DEPTH_COMPONENT32F,
		channels: sharedProps.gl.DEPTH_COMPONENT,
	},
	DEPTH_COMPONENT24: {
		type: sharedProps.gl.UNSIGNED_INT,
		internalFormat: sharedProps.gl.DEPTH_COMPONENT24,
		channels: sharedProps.gl.DEPTH_COMPONENT,
	},
	DEPTH_COMPONENT16: {
		type: sharedProps.gl.UNSIGNED_SHORT,
		internalFormat: sharedProps.gl.DEPTH_COMPONENT16,
		channels: sharedProps.gl.DEPTH_COMPONENT,
	},
};

export const DEPTH = {
	LESS: sharedProps.gl.LESS,
	LEQUAL: sharedProps.gl.LEQUAL,
	GREATER: sharedProps.gl.GREATER,
};

export const CULL = {
	BACK: sharedProps.gl.BACK,
	FRONT: sharedProps.gl.FRONT,
	DOUBLE: sharedProps.gl.FRONT_AND_BACK,
};

export const DRAW = {
	STATIC_DRAW: sharedProps.gl.STATIC_DRAW,
	DYNAMIC_DRAW: sharedProps.gl.DYNAMIC_DRAW,
	STREAM_DRAW: sharedProps.gl.STREAM_DRAW,
};
