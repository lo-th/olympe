/**
 * @author alteredq / http://alteredqualia.com/
 *
 */

THREE.EyeShader = {

	/* -------------------------------------------------------------------------
	//	Dynamic terrain shader
	//		- Blinn-Phong
	//		- height + normal + diffuse1 + diffuse2 + specular + detail maps
	//		- point, directional and hemisphere lights (use with "lights: true" material option)
	//		- shadow maps receiving
	 ------------------------------------------------------------------------- */

	'eye' : {

		uniforms: {

			"texEyeCol": { type: "t", value: null },
			"texEyeNrm": { type: "t", value: null },
			"texEnvRfl": { type: "t", value: null },
			"texEnvDif": { type: "t", value: null },
			
			"pupil_size":				{ type: "f", value: 0.20 },	// pupil resting size
			"iris_tex_start":			{ type: "f", value: 0.009},	// V coordinate in texture where the iris color begins
			"iris_tex_end":			{ type: "f", value: 0.13 },	// V coordinate in texture where the iris color ends
			"iris_border":			{ type: "f", value: 0.00 },	// Insets the iris from the cornea
			"iris_size":				{ type: "f", value: 0.52 },	// Iris plane distance from origin
			"iris_edge_fade":			{ type: "f", value: 0.04 },	// Distance that sclera fades out onto cornea
			"iris_inset_depth":		{ type: "f", value: 0.03 },	// Distance that sclera shifts out onto cornea
			"sclera_tex_scale":		{ type: "f", value: -0.14},	// Controls V scale of sclera texture
			"sclera_tex_offset":		{ type: "f", value: 0.04 },	// Offsets sclera texture in V (leave at 0 to match iris)
			"ior":					{ type: "f", value: 1.30 },	// cornea index of refraction
			"refract_edge_softness":	{ type: "f", value: 0.10 },	// How far to fade out the back edge of the eye

			"iris_texture_curvature":	  { type: "f", value: 0.50 },	// How much the iris bows inward for computing the pupil pos
			"arg_iris_shading_curvature": { type: "f", value: 0.5 },	// How much the iris bows inward for computing normals and shadows

			"tex_U_offset":			{ type: "f", value: 0.25 },	// Rotate the texture around the eye
			"cornea_bump_amount":		{ type: "f", value: 0.10 },	// Adjust cornea normals to fake the cornea bulging out this much
			"cornea_bump_radius_mult":{ type: "f", value: 0.90 },	// Multiply the radius of the cornea bump beyond the iris
			"iris_normal_offset":		{ type: "f", value: 0.00 },	// Offset the edge of the cornea for the cornea bump
			"cornea_density":			{ type: "f", value: 0.00 },	// Add fog to the cornea
			"bump_texture":			{ type: "f", value: 0.30 },	// Bump Texture value
			"catshape":				{ type: "i", value: 0 	 },	// Cat eye shape
			"col_texture":			{ type: "i", value: 1 	 }
	    },

		fragmentShader: [
		    // inputs from vertex shader
			"varying vec3 oPosition;",
			"varying vec3 oNormal;",
			"varying vec3 oView;",
			
			"varying vec3 mPosition;",
			"varying vec3 mNormal;",
			"varying vec3 mView;",
			
			"varying vec3 vPosition;",
			"varying vec3 vNormal;",
			
			"uniform mat3 normalMatrix;",
			"uniform mat4 modelMatrix;",
			
			// material uniforms
			"uniform sampler2D texEyeCol;",	
			"uniform sampler2D texEyeNrm;",
			"uniform sampler2D texEnvRfl;",
			"uniform sampler2D texEnvDif;",
			
			"uniform float pupil_size;",
			"uniform float iris_tex_start;",
			"uniform float iris_tex_end;",
			"uniform float iris_border;",
			"uniform float iris_size;",
			"uniform float iris_edge_fade;",
			"uniform float iris_inset_depth;",
			"uniform float sclera_tex_scale;",
			"uniform float sclera_tex_offset;",
			"uniform float ior;",
			"uniform float refract_edge_softness;",

			"uniform float iris_texture_curvature;",
			"uniform float arg_iris_shading_curvature;",

			"uniform float tex_U_offset;",
			"uniform float iris_normal_offset;",
			"uniform float cornea_density;",
			"uniform float bump_texture;",
			"uniform int   catshape;",
			"uniform int   col_texture;",
			
			"#define PI 3.14159265358979323846264",
			
			"float intersectSphere",
			"(",
				"vec3 ray_origin,",
				"vec3 ray_dir,",
				"vec3 sphere_center,",
				"float sphere_rad,",
				"float trace_dir",
			")",
			"{",
				"vec3 disp = ray_origin - sphere_center;",
				"float B = dot(disp, ray_dir);",
				"float C = dot(disp, disp) - sphere_rad * sphere_rad;",
				"float D = B*B - C;",
				"return D > 0.0 ? -B + trace_dir * sqrt(D) : -1.0;",
			"}",

			// GL_OES_standard_derivatives needs to be enabled for dFdx dFdy functions in normalMapComp() to work
			"#extension GL_OES_standard_derivatives : enable",
			
			"vec3 normalMapComp",
			"(",
				"sampler2D normalMap,",
				"vec2 inUV,",
				"vec3 eye_pos,",
				"vec3 surf_norm,",
				"float normalScale",
			")",
			"{",
				"vec3 q0 = dFdx( eye_pos.xyz );",
				"vec3 q1 = dFdy( eye_pos.xyz );",
				"vec2 st0 = dFdx( inUV.st );",
				"vec2 st1 = dFdy( inUV.st );",

				"vec3 S = normalize(  q0 * st1.t - q1 * st0.t );",
				"vec3 T = normalize( -q0 * st1.s + q1 * st0.s );",
				"vec3 N = normalize( surf_norm );",

				"vec3 mapN = texture2D( normalMap, inUV ).xyz * 2.0 - 1.0;",
				"mapN.xy = normalScale * mapN.xy;",
				"mat3 tsn = mat3( S, T, N );",
				"return normalize( tsn * mapN );",
			"}",
			
			"vec3 sphericalRefl( sampler2D panoTex, vec3 vReflect)",
			"{",
				"float yaw = .5 + atan( vReflect.z, vReflect.x ) / ( 2.0 * PI );",
				"float pitch = .5 + atan( vReflect.y, length( vReflect.xz ) ) / ( PI );",
				"return texture2D( panoTex, vec2( yaw, pitch ) ).rgb;",
			"}",
			"void main()",
			"{",
				// Eye Shader credits:
				// v.1 S.Bertout CG to RSL
				// v.2 A.Vill RSL
				// v.3 D.Dresser RSL
				// v.4 A.Vill GLSL
				
				// declare outputs
				"float cornea_mask = 0.0;",
				"float pupil_mask = 0.0;",
				"float cornea_fade;",
				"float cornea_alpha = 1.0;",
				"vec3 iris_normal;",
				"vec3 cornea_normal;",
				"float eye_U;",
				"float eye_V;",
				"float iris_U = 0.0;",
				"float iris_V = 0.0;",
				
				"float iris_depth = 1.0 - pow( iris_size, 3.0 );",
				"float iris_shading_curvature = arg_iris_shading_curvature;",
				"vec3 _norm_P = normalize( mPosition );",
				"float _measured_eye_radius = length( mPosition );",
				"vec3 _major_axis = vec3( 0.0, 0.0, 1.0 );",
				"float _slice = _norm_P.z - iris_depth;",
				"float _iris_rad = sqrt( max( 0.0, 1.0 - iris_depth * iris_depth ) );",
				"vec3 _refract_N;",
				"cornea_normal = mNormal;",
				"_refract_N = cornea_normal;",
				"vec3 ballCtr = vec3( 0.0, 0.0, 0.0 );",
				"vec3 _pupil_center = ballCtr + iris_depth * _major_axis;",
				"float _border_scale = 0.5;",
				
				"float _cur_refract_edge_softness = max( 0.000001, refract_edge_softness * 0.25);",
				"iris_normal = mNormal;",
				"float _cornea_mask_for_normals = 0.0;",
				"vec3 _iris_point = _norm_P;",
				"if( _slice >= 0.0 ) {",
				"cornea_alpha = 0.0;",
				"float _graded_eta = 1.0 / ior;",
				"float _pupil_depth = iris_depth;",
				"float _pupil_center_depth = iris_depth;",

				"vec3 _refract_vec = refract( mView, _refract_N, _graded_eta );",
				"float _final_iris_size = 1.0 / ( 1.0 + iris_border );",
				"float _final_pupil_size = pupil_size  * _final_iris_size;",
				"float _final_pupil_rad = _final_pupil_size * _iris_rad;",

					"if( dot( _refract_vec, _refract_vec ) > 0.0 ) {",
						"float _iris_scale = 1.0 / max( 0.0001, _iris_rad );",
						"float _refract_edge_angle_boost = min(20.0, 1.0 / abs( mView.z ) );",
						"if( iris_shading_curvature > 0.0) _refract_edge_angle_boost = 1.0;",

						"float _iris_T_shading = -1.0;",
						"{",
							//if( abs( iris_shading_curvature ) < 0.0001 ) iris_shading_curvature = 0.0001;
							"float _shading_curvature_dir = sign( iris_shading_curvature );",

							"float _shading_curve_radius = abs( 1.0 / iris_shading_curvature );",
							"vec3 _shading_curve_center = vec3( 0, 0, iris_depth + _shading_curvature_dir *",
								"sqrt( _shading_curve_radius * _shading_curve_radius - _iris_rad * _iris_rad ) );",

							"_iris_T_shading = intersectSphere( _norm_P, _refract_vec,",
								"_shading_curve_center, _shading_curve_radius, _shading_curvature_dir );",

							"float ray_dist_from_center = length( cross( _shading_curve_center - _norm_P,",
								"_shading_curve_center - _norm_P -_refract_vec ) );",
							"cornea_alpha = 1.0 - smoothstep( _shading_curve_radius -",
								"_cur_refract_edge_softness * 0.5, _shading_curve_radius, ray_dist_from_center );",

							"_iris_point = _norm_P + _iris_T_shading * _refract_vec;",
							"iris_normal = -_shading_curvature_dir * normalize( _iris_point - _shading_curve_center );",
						"}",
						"float _iris_T_texture = -1.0;",
						"if ( iris_texture_curvature == iris_shading_curvature )",
						"{",
						"_iris_T_texture = _iris_T_shading;",
						"}",
						"else",
						"{",
							//if( abs( iris_texture_curvature ) < 0.0001 ) iris_texture_curvature = 0.0001;
							"float _texture_curvature_dir = sign( iris_texture_curvature );",

							"float _texture_curve_radius = abs( 1.0 / iris_texture_curvature );",
							"vec3 _texture_curve_center = vec3( 0, 0, iris_depth + _texture_curvature_dir *",
								"sqrt( _texture_curve_radius * _texture_curve_radius - _iris_rad * _iris_rad ) );",

							"_iris_T_texture = intersectSphere( _norm_P, _refract_vec,",
								"_texture_curve_center, _texture_curve_radius, _texture_curvature_dir );",
						"}",
						"if( _iris_T_shading >= -0.0001 )",
						"{",
							"vec3 _fade_P = (_norm_P + _iris_T_shading * _refract_vec) * _iris_scale;",
							"cornea_alpha = min( cornea_alpha,",
								"smoothstep( -_cur_refract_edge_softness * _refract_edge_angle_boost, 0.0, 1.0 -",
									"sqrt( _fade_P.x * _fade_P.x + _fade_P.y * _fade_P.y ) ) );",
						"}",
						"else",
						"{",
							"cornea_alpha = 0.0;",
						"}",

						"if( _iris_T_texture >= -0.0001 && _iris_T_shading >= -0.0001)",
						"{",
							"float _fade_T = _iris_T_shading * cornea_density;",
							"cornea_fade = clamp( _fade_T * _fade_T, 0.0, 1.0 );",
							"vec3 _iris_point_for_st = _norm_P + _iris_T_texture * _refract_vec;",
							"vec3 _iris_ST = ( _iris_scale * _iris_point_for_st );",
							"vec3 _iris_ST_orient = vec3( _iris_ST.xy, 0);",
							"float _r = 0.0;",
							"if( catshape == 1 )",
							"{",
								// Cat Eye
								"float cateyeShift = 0.1;",
								"_final_pupil_size = _final_pupil_size * ( 1.0 + cateyeShift );",
								"_r =  sqrt( pow( pow( _iris_ST.x, 0.7), 2.0 ) + pow( _iris_ST.y * ( _final_pupil_size * ( 1.0 + cateyeShift ) + cateyeShift ), 2.0 ));",
							"}else {",
								// Human Eye
								"_r = length( _iris_ST_orient );",
							"}",
							"float _theta = ( atan( _iris_ST_orient.y, _iris_ST_orient.x ) / PI + 1.0 ) * 0.5;",

							"if( _r <= 1.0 + _cur_refract_edge_softness * _refract_edge_angle_boost )",
							"{",
								"float _iris_pos = (_r - _final_pupil_size) / (_final_iris_size - _final_pupil_size);",
								"if( _r > _final_iris_size )",
								"{",
									" _iris_pos = 1.0 + (_r * (1.0 + iris_border) - 1.0) * _border_scale;",
								"}",
								"pupil_mask = ( 1.0 - step( -_iris_pos, 0.0 ) ) * cornea_alpha;",
								"iris_U = _theta + tex_U_offset;",
								"iris_V = mix( iris_tex_start, iris_tex_end, _iris_pos );",
								"if( _r < _final_pupil_size )",
								"{",
									"iris_V = _r / _final_pupil_size * iris_tex_start;",
								"}",
							"}",
						"}",
						"cornea_mask = smoothstep( iris_inset_depth, iris_edge_fade + iris_inset_depth, _slice );",
						"_cornea_mask_for_normals = smoothstep( iris_inset_depth,",
						"iris_edge_fade + iris_inset_depth, _slice - iris_normal_offset );",
					"}",
				"}",
				"iris_normal = mix( mNormal, iris_normal, _cornea_mask_for_normals );",
				"eye_U = ( atan( _norm_P.y, _norm_P.x ) / PI + 1.0 ) * 0.5 + tex_U_offset;",
				"float _iris_edge_V = mix( iris_tex_start, iris_tex_end, 1.0 + iris_border * _border_scale);",
				"eye_V = mix( _iris_edge_V, sclera_tex_scale, _slice - sclera_tex_offset );",
				
				//////////////////////////////////////////////////////////////////////////////			
				
				"vec2 eyeUVs = mix( vec2( eye_U, eye_V ), vec2( iris_U, iris_V ), cornea_mask);",	
				
				// Reflections
				"vec3 fNormalSpec = normalMapComp( texEyeNrm, vec2( eye_U, eye_V ), -vPosition, oNormal, bump_texture * (1.0-cornea_mask) );",
				"vec3 oReflect = normalize( reflect( oView, fNormalSpec ) );",
				"vec3 envTex = sphericalRefl( texEnvRfl, oReflect );",

				// fresnel
				"const float fresBias = 0.002;",
				"const float fresScale = 0.5;",
				"const float fresPow = 6.0;",
				"float fresnel = fresBias + fresScale * pow( 1.0 + dot( oView, fNormalSpec ), fresPow );",		
				
				// eye texture
				"vec3 eyeTexIris = vec3( 0.8 );",
				"vec3 eyeTexSclera = vec3( 0.8 );",
				"if( col_texture == 1 ){",
					"eyeTexIris = texture2D( texEyeCol, vec2( iris_U, iris_V ) ).rgb  * (1.0 - pupil_mask);",
					"eyeTexSclera = texture2D( texEyeCol, vec2( eye_U, eye_V ) ).rgb;",
				"}",
				"vec3 eyeTex = mix( eyeTexSclera, eyeTexIris, cornea_mask );",		

				//sRGB to linear
				"eyeTex = pow(eyeTex, vec3(2.2));",
				"envTex = pow(envTex, vec3(2.2));",
				"envTex = envTex * 10.0;  envTex = pow(envTex, vec3(1.6));",// exposure and gamma increase to match HDR

				// experiment with diffuse lighting vs baked hdr diffuse
				"vec3 composites = vec3(1.0);",
				"vec3 fNormalDiff = mNormal;",
				"if( 0 == 1 ){",
						// Diff Normals. All lighting done in view space
						"fNormalDiff = normalMapComp( texEyeNrm, eyeUVs, -vPosition, normalize( normalMatrix * iris_normal ),  bump_texture * mix( 0.5, 1.0, cornea_mask) );",
						// Put Spec Normals in view space too
						"fNormalSpec = vec3( viewMatrix * vec4( fNormalSpec, 0.0 ));",
						
						"vec3 directionalLightDirection = vec3( -1.0, 1.75, 1.0 );",			
						"vec3 dirLgtVector = normalize( vec3( viewMatrix * vec4( directionalLightDirection, 0.0 )));",
						//diffuse
						"float diffuse = max( dot( fNormalDiff, dirLgtVector ), 0.0 ) * 0.6;",
						//spec
						"vec3 dirHalfVector = normalize( dirLgtVector + normalize( -vPosition ) );",
						"float dirDotNormalHalf = max( dot( fNormalSpec, dirHalfVector ), 0.0 );",
						"float specular = max( pow( dirDotNormalHalf, 1000.0 ), 0.0 ) * 5.0;",
						
						// Dome light
						"vec3 hemiLightDirection = vec3( 0.0, 1.0, 0.0 );",				
						"vec3 hemiLgtVector = normalize( vec3( viewMatrix * vec4( hemiLightDirection, 0.0 )));",
						"float hemiDiffuseWeight = 0.5 * dot( fNormalDiff, hemiLgtVector ) + 0.5;",
						"vec3  hemiCol = mix( vec3( 0.08, 0.03, 0.002 ), vec3( 0.15, 0.2, 0.25 ), hemiDiffuseWeight);",
						
						"composites = mix( eyeTex * (diffuse + hemiCol), envTex, fresnel )   + specular;",
				"}else{",
						"fNormalDiff = normalMapComp( texEyeNrm, eyeUVs, -vPosition, normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * iris_normal ),  bump_texture * mix( 0.5, 1.0, cornea_mask) );",
						"vec3 sphericalDiff = sphericalRefl( texEnvDif,  fNormalDiff  );",
						"vec3 sphericalDiffCatarax = pow( sphericalRefl( texEnvDif,  oNormal  ), vec3(2.0)) * vec3( 0.8, 0.79, 0.77);",
						"sphericalDiff = pow( sphericalDiff, vec3(2.0)) * 1.5;", // really arbitrary color correct

						"composites = mix( eyeTex * sphericalDiff, sphericalDiffCatarax, cornea_fade * 10.0 * cornea_mask);",
						"composites = composites * ( 1.0 - fresnel ) + ( envTex * fresnel );",
				"}",

				// linear to sRGB
				"composites =  pow( composites, vec3(1.0 / 2.2));",

				"gl_FragColor = vec4( composites, 1.0);",
			"}"

		].join("\n"),

		vertexShader: [
		    "varying vec3 oPosition;",  // position in world space
			"varying vec3 oNormal;",    // normal in world space
			"varying vec3 oView;",      // view vector in world space
			
			"varying vec3 mPosition;",  // position in model space
			"varying vec3 mNormal;",    // normal in model space
			"varying vec3 mView;",      // view vector in model space
			
			"varying vec3 vPosition;",	 // position in view space
			"varying vec3 vNormal;",    // normal in view space

			"uniform float iris_size;",		
			"uniform float cornea_bump_amount;",
			"uniform float cornea_bump_radius_mult;",
		
			"mat4 InverseMatrix( mat4 A ) {",
			
				"float s0 = A[0][0] * A[1][1] - A[1][0] * A[0][1];",
				"float s1 = A[0][0] * A[1][2] - A[1][0] * A[0][2];",
				"float s2 = A[0][0] * A[1][3] - A[1][0] * A[0][3];",
				"float s3 = A[0][1] * A[1][2] - A[1][1] * A[0][2];",
				"float s4 = A[0][1] * A[1][3] - A[1][1] * A[0][3];",
				"float s5 = A[0][2] * A[1][3] - A[1][2] * A[0][3];",
			 
				"float c5 = A[2][2] * A[3][3] - A[3][2] * A[2][3];",
				"float c4 = A[2][1] * A[3][3] - A[3][1] * A[2][3];",
				"float c3 = A[2][1] * A[3][2] - A[3][1] * A[2][2];",
				"float c2 = A[2][0] * A[3][3] - A[3][0] * A[2][3];",
				"float c1 = A[2][0] * A[3][2] - A[3][0] * A[2][2];",
				"float c0 = A[2][0] * A[3][1] - A[3][0] * A[2][1];",
			 
				"float invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);",
			 
				"mat4 B;",
			 
				"B[0][0] = ( A[1][1] * c5 - A[1][2] * c4 + A[1][3] * c3) * invdet;",
				"B[0][1] = (-A[0][1] * c5 + A[0][2] * c4 - A[0][3] * c3) * invdet;",
				"B[0][2] = ( A[3][1] * s5 - A[3][2] * s4 + A[3][3] * s3) * invdet;",
				"B[0][3] = (-A[2][1] * s5 + A[2][2] * s4 - A[2][3] * s3) * invdet;",
			 
				"B[1][0] = (-A[1][0] * c5 + A[1][2] * c2 - A[1][3] * c1) * invdet;",
				"B[1][1] = ( A[0][0] * c5 - A[0][2] * c2 + A[0][3] * c1) * invdet;",
				"B[1][2] = (-A[3][0] * s5 + A[3][2] * s2 - A[3][3] * s1) * invdet;",
				"B[1][3] = ( A[2][0] * s5 - A[2][2] * s2 + A[2][3] * s1) * invdet;",
			 
				"B[2][0] = ( A[1][0] * c4 - A[1][1] * c2 + A[1][3] * c0) * invdet;",
				"B[2][1] = (-A[0][0] * c4 + A[0][1] * c2 - A[0][3] * c0) * invdet;",
				"B[2][2] = ( A[3][0] * s4 - A[3][1] * s2 + A[3][3] * s0) * invdet;",
				"B[2][3] = (-A[2][0] * s4 + A[2][1] * s2 - A[2][3] * s0) * invdet;",
			 
				"B[3][0] = (-A[1][0] * c3 + A[1][1] * c1 - A[1][2] * c0) * invdet;",
				"B[3][1] = ( A[0][0] * c3 - A[0][1] * c1 + A[0][2] * c0) * invdet;",
				"B[3][2] = (-A[3][0] * s3 + A[3][1] * s1 - A[3][2] * s0) * invdet;",
				"B[3][3] = ( A[2][0] * s3 - A[2][1] * s1 + A[2][2] * s0) * invdet;",
			 
				"return B;",
			"}",

			"mat3 makeRotationDir( vec3 direction, vec3 up )",
			"{",
				"vec3 xaxis = normalize( cross( up, direction));",
				"vec3 yaxis = normalize( cross( direction, xaxis));",

				"return mat3( xaxis.x, xaxis.y, xaxis.z, yaxis.x,  yaxis.y, yaxis.z, direction.x, direction.y, direction.z);",
			"}",
			
			"mat3 rotationMatrix(vec3 axis, float angle)",
			"{",
				"axis = normalize(axis);",
				"float s = sin(angle);",
				"float c = cos(angle);",
				"float oc = 1.0 - c;",
				
				"return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,",
							"oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,",
							"oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);",
			"}",

			"vec3 corneaVertexDisp",
			"(",
				"vec3		eyeP,",
				"vec3		eyeN,",
				"float		iris_size,",
				"float		cornea_bump_amount,",
				"float		cornea_bump_radius_mult,",
				"out vec3	outN",
			")",
			"{",
				"vec3 _norm_P = normalize( eyeP );",
				"float iris_depth = 1.0 - pow(  iris_size, 3.0 );",
				"float _measured_eye_radius = length( eyeP );",
				"float _iris_rad = sqrt( max( 0.0, 1.0 - iris_depth * iris_depth ) );",
				"float _bump_t = 1.0;",
				"if( _norm_P[2] > 0.0 )",
				"{",
					"_bump_t = min( 1.0, sqrt( max( 0.0, 1.0 - _norm_P[2] * _norm_P[2] ) ) / ( _iris_rad * cornea_bump_radius_mult ) );",
				"}",
				"float _bump_factor = pow( 1.0 - pow( _bump_t, 2.5 ), 1.0 );",
				"_bump_factor *= cornea_bump_amount * _iris_rad * _measured_eye_radius;",
				
				// faking bulging cornea normals yolo
				"float NzMask = 1.0 - (_bump_factor * (1.0-eyeN.z) * 2.5);",			
				"outN =  normalize( vec3( eyeN.xy, eyeN.z * NzMask));",
				
				"return _bump_factor * eyeN;",
			"}",
			
			"void main() {",

				"vec3 displacedN;",
				"vec3 displacedP = position.xyz + corneaVertexDisp( position.xyz, normal, iris_size, cornea_bump_amount, cornea_bump_radius_mult, displacedN );",		
							
				"oPosition	= vec3( modelMatrix * vec4( displacedP, 1.0 ));",
				"oNormal		= normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * displacedN );",
				"oView		= normalize( oPosition - cameraPosition );",

				"mPosition	= displacedP;",
				"mNormal 	= displacedN;",
				 
				// we need to get cameraPosition in object space but three.js gives it in world space ( camera.matrixWorld )
				// its possible to get it from gl_ModelViewMatrixInverse[3].xyz matrix but can't access it from three.js
				// an option is to calculate and pass it from three.js using THREE.Matrix4()
				// .getInverse( .multiplyMatrices( camera.matrixWorldInverse, mesh.matrixWorld ) )
				// or since Three.js provides us with modelViewMatrix we can inverse it using expensive InverseMatrix() function
				"mat4 myModelViewMatrixInverse = InverseMatrix( modelViewMatrix );",
				"mView 		= normalize( mPosition - myModelViewMatrixInverse[3].xyz );",
				
						// EXPERIMENTS with rotations
						/*
						vec3 lookat = normalize( vec3( 0.5, 0.0, 6.0) );
						mPosition	= makeRotationDir( lookat, vec3( 0.0, 1.0, 0.0) ) * mPosition;
						mNormal		= makeRotationDir( lookat, vec3( 0.0, 1.0, 0.0) ) * mNormal; mNormal = normalize( mNormal );
						mView		= makeRotationDir( lookat, vec3( 0.0, 1.0, 0.0) ) * mView; mView = normalize( mView );

						
						vec3 axis	= vec3( 1.0, 0.0, 0.0);
						float angle	= radians(-90.0);
						mPosition	= rotationMatrix( axis, angle) * mPosition;
						mNormal		= rotationMatrix( axis, angle) * mNormal; mNormal = normalize( mNormal );
						mView		= rotationMatrix( axis, angle) * mView; mView = normalize( mView );			
						*/
						
				"vPosition	= vec3( modelViewMatrix * vec4( displacedP, 1.0 ));",
				"vNormal		= normalize( normalMatrix * displacedN );",
				
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( displacedP, 1.0 );",
				
			"}"

		].join("\n")

	}

};
